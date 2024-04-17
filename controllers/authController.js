const bcrypt = require("bcrypt");
const adminModel = require("../models/adminModel");
const sellerModel = require("../models/sellerModel");
const { createToken } = require("../utils/tokenCreate");
const responseReturn = require("../utils/response");
const sellerCustomersModel = require("../models/chat/sellerCustomersModel");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");
const upload = multer();
const admin_login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await adminModel.findOne({ email }).select("+password");
    if (admin) {
      const match = await bcrypt.compare(password, admin.password);
      console.log(admin);
      if (match) {
        const token = createToken({
          id: admin.id,
          role: admin.role,
        });
        res.cookie("accessToken", token, {
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
        });
        console.log(token);
        return responseReturn(res, 200, { token, message: "login berhasil" });
      } else {
        console.log("password salah");
        return responseReturn(res, 400, { error: "password anda salah" });
      }
    } else {
      return responseReturn(res, 404, { error: "email tidak ditemukan" });
    }
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};

const seller_login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const seller = await sellerModel.findOne({ email }).select("+password");
    if (seller) {
      const match = await bcrypt.compare(password, seller.password);
      if (match) {
        const token = createToken({ id: seller.id, role: seller.role });
        res.cookie("accessToken", token, {
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
        });
        return responseReturn(res, 200, { token, message: "login berhasil" });
      } else {
        return responseReturn(res, 400, { error: "password anda salah" });
      }
    } else {
      return responseReturn(res, 404, { error: "email tidak ditemukan" });
    }
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};
const seller_register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const getUser = await sellerModel.findOne({ email });
    if (getUser) {
      return responseReturn(res, 403, { error: "email sudah terdaftar" });
    } else {
      const seller = await sellerModel.create({
        name,
        email,
        password: await bcrypt.hash(password, 10),
        shopInfo: {},
      });
      await sellerCustomersModel.create({
        myId: seller.id,
      });
      const token = createToken({
        id: seller.id,
        role: seller.role,
      });
      res.cookie("accessToken", token, {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
      });
      responseReturn(res, 201, {
        token,
        message: "Akun seller berhasil dibuat",
      });
    }
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};
const getUser = async (req, res) => {
  const { id, role } = req;
  try {
    if (role === "admin") {
      const admin = await adminModel.findById(id);
      return responseReturn(res, 200, { userInfo: admin });
    } else if (role === "seller") {
      const seller = await sellerModel.findById(id);
      return responseReturn(res, 200, { userInfo: seller });
    } else {
      console.log("user");
    }
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};

const upload_image_profile = async (req, res) => {
  const { id } = req;
    upload.single("image")(req, res, async (err) => {
      if (err) {
        console.log(err);
        return responseReturn(res, 500, { error: err.message });
      } else {
        const image = req.file;

        try {
          cloudinary.config({
            cloud_name: process.env.cloud_name,
            api_key: process.env.api_key,
            api_secret: process.env.api_secret,
            secure: true,
          });
          const tempDir = path.join(__dirname, "temp");
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
          }

          const tempFilePath = path.join(tempDir, image.originalname);
          fs.writeFileSync(tempFilePath, image.buffer);
          const result = await cloudinary.uploader.upload(tempFilePath, {
            folder: "profile",
          });
          if (result) {
            const image = result.url;
            console.log({ image, id });
            await sellerModel.findByIdAndUpdate(id, {
              image,
            });
            const userInfo = await sellerModel.findById(id)
            return responseReturn(res, 201, {userInfo,
              message: "gambar berhasil diperbarui",
            });
          } else {
            return responseReturn(404, { message: "gagal mengupload gambar" });
          }
        } catch (error) {
          console.log(error);
          return responseReturn(500, {
            error: "error uploading image in cloudinary",
          });
        }
      }
    });
};

const add_info_profile = async (req, res) =>{
const {id} = req
  const {shopName, city, district, spesificAddress} = req.body
  try{
    await sellerModel.findByIdAndUpdate(id, {
      shopInfo: {
        shopName,
        city,
        district,
        spesificAddress
      }
    })
    const userInfo = await sellerModel.findById(id)
    responseReturn(res, 201, {userInfo, message: "data profile sukses di update"})
  }

  catch(error){
    console.log(error.message)
    responseReturn(res,500, {error:error.message})
  }
}
module.exports = {
  admin_login,
  getUser,
  seller_register,
  seller_login,
  upload_image_profile,
  add_info_profile
};
