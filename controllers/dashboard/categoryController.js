const multer = require("multer");
const categoryModel = require("../../models/categoryModel");
const responseReturn = require("../../utils/response");
const cloudinary = require("cloudinary").v2;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const add_category = async (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      return responseReturn(res, 404, { error: err.message });
    } else {
      const { name } = req.body;
      const file = req.file;

      if (!file || !file.buffer) {
        return responseReturn(res, 400, {
          error: "Tidak ada file yang diupload",
        });
      }

      const fileBuffer = file.buffer;

      try {
        const existingCategory = await categoryModel.findOne({
          name: name.trim(),
        });
        if (existingCategory) {
          return responseReturn(res, 400, { error: "Categori sudah ada" });
        }

        cloudinary.config({
          cloud_name: process.env.cloud_name,
          api_key: process.env.api_key,
          api_secret: process.env.api_secret,
          secure: true,
        });

        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader
            .upload_stream({ folder: "categories" }, (error, result) => {
              if (error) reject(error);
              else resolve(result);
            })
            .end(fileBuffer);
        });

        if (result) {
          const slug = name.trim().split(" ").join("-");
          const category = await categoryModel.create({
            name,
            slug,
            image: result.url,
          });

          responseReturn(res, 201, {
            category,
            message: "Kategori berhasil ditambahkan",
          });
        } else {
          responseReturn(res, 404, { error: "Gagal upload" });
        }
      } catch (error) {
        console.log(error.message);
        return responseReturn(res, 500, { error: error.message });
      }
    }
  });
};

const get_categories = async (req, res) => {
  const { perPage, searchValue, page } = req.query;
  const skipPage = parseInt(perPage) * (parseInt(page) - 1);
  try {
    if (searchValue && perPage && page) {
      const categories = await categoryModel
        .find({ $text: { $search: searchValue } })
        .skip(skipPage)
        .limit(parseInt(perPage))
        .sort({ createdAt: -1 });
      const totalCategories = await categoryModel
        .find({ $text: { $search: searchValue } })
        .countDocuments();
      responseReturn(res, 200, { categories, totalCategories });
    } else if (searchValue === " " && perPage && page) {
      const categories = await categoryModel
        .find({})
        .skip(skipPage)
        .limit(parseInt(perPage))
        .sort({ createdAt: -1 });
      const totalCategories = await categoryModel.find({}).countDocuments();
      responseReturn(res, 200, { categories, totalCategories });
    } else {
      const categories = await categoryModel
        .find({})
        .skip(skipPage)
        .limit(perPage ? parseInt(perPage) : 1)
        .sort({ createdAt: -1 });
      const totalCategories = await categoryModel.find({}).countDocuments();
      responseReturn(res, 200, { categories, totalCategories });
    }
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};

const get_category = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const category = await categoryModel.findById(categoryId);
    if (!category) {
      responseReturn(res, 404, { error: "category tidak ditemukan" });
    } else {
      responseReturn(res, 200, { category });
    }
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};

const delete_category_image = async (public_id) => {
  try {
    await cloudinary.uploader.destroy(public_id);
  } catch (error) {
    throw new Error(`Gagal menghapus gambar dari Cloudinary: ${error.message}`);
  }
};
const delete_category = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const category = await categoryModel.findById(categoryId);
    cloudinary.config({
      cloud_name: process.env.cloud_name,
      api_key: process.env.api_key,
      api_secret: process.env.api_secret,
    });
    if (!category) {
      return responseReturn(res, 404, { error: "Kategori tidak ditemukan" });
    }

    if (category.image) {
      const publicId = category.image;
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          console.log("Gagal menghapus gambar dari Cloudinary:", error);
        } else {
          console.log("Berhasil menghapus gambar dari Cloudinary:", result);
        }
      });
    }

    await categoryModel.findByIdAndDelete(categoryId);
    responseReturn(res, 200, { message: "Kategori berhasil dihapus" });
  } catch (error) {
    console.log(error);
    responseReturn(res, 500, { error: error.message });
  }
};
const edit_category = async (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      return responseReturn(res, 404, { error: err.message });
    }

    const categoryId = req.params.id;
    const { name } = req.body;
    const file = req.file;

    try {
      let updatedCategory;
      let imageUrl;
      cloudinary.config({
        cloud_name: process.env.cloud_name,
        api_key: process.env.api_key,
        api_secret: process.env.api_secret,
        secure: true,
      });
      if (file) {
        const fileBuffer = file.buffer;

        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ folder: "categories" }, (error, result) => {
              if (error) reject(error);
              else resolve(result);
            })
            .end(fileBuffer);
        });

        if (!result) {
          return responseReturn(res, 404, { error: "Gagal mengunggah gambar" });
        }

        imageUrl = result.url;
      }

      updatedCategory = await categoryModel.findById(categoryId);
      if (!updatedCategory) {
        return responseReturn(res, 404, { error: "Kategori tidak ditemukan" });
      }

      if (file) {
        if (updatedCategory.image) {
          const publicId = updatedCategory.image.split("/").pop().split(".")[0];
          cloudinary.uploader.destroy(publicId, (error, result) => {
            if (error) {
              console.log("Gagal menghapus gambar dari Cloudinary:", error);
            } else {
              console.log("Berhasil menghapus gambar dari Cloudinary:", result);
            }
          });
        }
        updatedCategory.image = imageUrl;
      }

      updatedCategory.name = name;
      await updatedCategory.save();

      responseReturn(res, 200, {
        category: updatedCategory,
        message: "Kategori berhasil diubah",
      });
    } catch (error) {
      console.log(error.message);
      return responseReturn(res, 500, { error: error.message });
    }
  });
};

module.exports = {
  add_category,
  get_category,
  edit_category,
  get_categories,
  delete_category,
};
