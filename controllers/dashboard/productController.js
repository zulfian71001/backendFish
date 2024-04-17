const responseReturn = require("../../utils/response");
const productModel = require("../../models/productModel");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");
const upload = multer();

const add_product = async (req, res) => {
    const {id} = req
  upload.array("images")(req, res, async (err) => {
    if (err) {
      return responseReturn(res, 404, { error: err.message });
    } else {
      const { name, categoryName, stock, price, shopName, desc } = req.body;
      const files = req.files; 

      console.log(name, categoryName, stock, price);

      try {
        cloudinary.config({
          cloud_name: process.env.cloud_name,
          api_key: process.env.api_key,
          api_secret: process.env.api_secret,
          secure: true,
        });

        const uploadedImages = [];

        for (const file of files) {
          const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { folder: "products" },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(file.buffer); // Access file buffer directly

          });
          
          if (result) {
            uploadedImages.push(result.url);
          } else {
            return responseReturn(res, 404, { error: "gagal upload" });
          }
        }

        const slug = name.trim().split(" ").join("-");
        const product = await productModel.create({
            sellerId:id,
          name,
          categoryName,
          shopName,
          stock,
          price,
          slug,
          desc,
          images: uploadedImages, 
        });

        responseReturn(res, 201, {
          product,
          message: "produk berhasil ditambahkan",
        });
      } catch (error) {
        console.log(error.message);
        return responseReturn(res, 500, { error: error.message });
      }
    }
  });
};

const get_products = async (req, res) => {
    const { perPage, searchValue, page } = req.query;
    const skipPage = parseInt(perPage) * (parseInt(page) - 1);
    try {
      if (searchValue && perPage && page) {
        const products = await productModel
          .find({ $text: { $search: searchValue } })
          .skip(skipPage)
          .limit(parseInt(perPage))
          .sort({ createdAt: -1 });
        const totalProducts = await productModel
          .find({ $text: { $search: searchValue } })
          .countDocuments();
        responseReturn(res, 200, { products, totalProducts });
      } else if (searchValue === " " && perPage && page) {
        const products = await productModel
          .find({})
          .skip(skipPage)
          .limit(parseInt(perPage))
          .sort({ createdAt: -1 });
        const totalProducts = await productModel.find({}).countDocuments();
        responseReturn(res, 200, { products, totalProducts });
      } else {
        const products = await productModel
          .find({})
          .skip(skipPage)
          .limit(perPage ? parseInt(perPage) : 1)
          .sort({ createdAt: -1 });
        const totalProducts = await productModel.find({}).countDocuments();
        responseReturn(res, 200, { products, totalProducts });
      }
    } catch (error) {
      return responseReturn(res, 500, { error: error.message });
    }
  };  

const get_product = async (req, res) => {
    const { productId } = req.params;
  console.log(productId)
    try {
      const product = await productModel.findById(productId)
      console.log(product)
        responseReturn(res, 200, { product });
      } 
    catch (error) {
      return responseReturn(res, 500, { error: error.message });
    }
  }

  const update_product = async (req, res) => {
    try {
      const { productId, name, categoryName, stock, price, desc } = req.body;
  
      const updatedProduct = await productModel.findByIdAndUpdate(
        productId,
        { name, categoryName, stock, price, desc }
      );
  
      if (!updatedProduct) {
        return res.status(404).json({ error: "Produk tidak ditemukan" });
      }
  
      res.status(200).json({ message: "Produk berhasil diperbarui", product: updatedProduct });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

const update_product_image = async (req, res) => {
    try {
      upload.fields([{ name: "oldImage" }, { name: "newImage" }])(
        req,
        res,
        async (err) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
          } else {
            const { productId, oldImage } = req.body;
            const newImageFile = req.files["newImage"][0];
  
            console.log(newImageFile);
            cloudinary.config({
              cloud_name: process.env.cloud_name,
              api_key: process.env.api_key,
              api_secret: process.env.api_secret,
              secure: true,
            });
  
            try {
              const tempDir = path.join(__dirname, "temp");
              if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir);
              }
  
              const tempFilePath = path.join(tempDir, newImageFile.originalname);
              fs.writeFileSync(tempFilePath, newImageFile.buffer);
  
              const result = await cloudinary.uploader.upload(tempFilePath, {
                folder: "products",
              });
              if (result) {
                let { images } = await productModel.findById(productId);
                const index = images.findIndex((img) => img === oldImage);
                console.log({images, index})
                if (index !== -1) {
                  console.log(oldImage);
                  // Hapus gambar lama dari Cloudinary
                  const deletionResult = await cloudinary.uploader.destroy(oldImage);
                    // Update URL gambar lama dengan URL gambar baru
                    images[index] = result.url;
  
                    // Simpan perubahan ke database
                    await productModel.findByIdAndUpdate(productId, {
                      images,
                    });
                } else {
                  console.log("Old image not found in database");
                }
              }
              fs.unlinkSync(tempFilePath);
  
              res.status(201).json({
                message: "gambar produk berhasil diperbaharui",
                imageUrl: result.url,
              });
            } catch (error) {
              console.error(error);
              res
                .status(500)
                .json({ error: "Error uploading image to Cloudinary" });
            }
          }
        }
      );
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  module.exports ={add_product, get_products, get_product, update_product, update_product_image}