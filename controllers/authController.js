const bcrypt = require("bcrypt");
const adminModel = require("../models/adminModel");
const sellerModel = require("../models/sellerModel");
const mapModel = require("../models/mapModel");
const { createToken } = require("../utils/tokenCreate");
const responseReturn = require("../utils/response");
const sellerCustomersModel = require("../models/chat/sellerCustomersModel");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");
const customerModel = require("../models/customerModel");
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
const customer_login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const customer = await customerModel.findOne({ email }).select("+password");
    if (customer) {
      const match = await bcrypt.compare(password, customer.password);
      if (match) {
        const token = createToken({ id: customer.id, role: customer.role });
        res.cookie("accessToken", token, {
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
        });
        console.log(customer);
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

const customer_register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const getUser = await customerModel.findOne({ email });
    if (getUser) {
      return responseReturn(res, 403, { error: "email sudah terdaftar" });
    } else {
      const customer = await customerModel.create({
        name,
        email,
        password: await bcrypt.hash(password, 10),
        method: "",
      });
      await sellerCustomersModel.create({
        myId: customer.id,
      });
      const token = createToken({
        id: customer.id,
        role: customer.role,
      });
      res.cookie("accessToken", token, {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
      });
      responseReturn(res, 201, {
        token,
        message: "Akun customer berhasil dibuat",
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
      const customer = await customerModel.findById(id);
      return responseReturn(res, 200, { userInfo: customer });
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

const update_info_profile_seller = async (req, res) =>{
  const {id} = req
    const {name,email} = req.body
    try{
      await sellerModel.findByIdAndUpdate(id, {
       name,
       email
      })
      const userInfo = await sellerModel.findById(id)
      responseReturn(res, 201, {userInfo, message: "data profile sukses di update"})
    }
  
    catch(error){
      console.log(error.message)
      responseReturn(res,500, {error:error.message})
    }
  }

  const update_info_profile_store = async (req, res) =>{
    const {id} = req
    const {shopName,province, city, district,subDistrict, spesificAddress, noWa, noRek, noGopay} = req.body
      try{
        await sellerModel.findByIdAndUpdate(id, {
         shopInfo:{
          shopName,province, city, district,subDistrict, spesificAddress, noWa, noRek, noGopay
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
  

  const change_password_seller = async (req, res) =>{
    const {id} = req
      const {email, oldPassword, newPassword} = req.body
      try{
        const seller = await sellerModel.findById(id).select("+password")
        if (!seller) {
          return responseReturn(res, 404, { error: "Seller tidak ditemukan" });
        }
        if(email !== seller.email){
          
          return responseReturn(res, 400, {error: "email tidak sesuai "})
        }
        const match = await bcrypt.compare(oldPassword, seller.password);
        if(!match){
          return responseReturn(res, 400, {error: "password lama tidak sesuai"})
        }
 
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        await sellerModel.findByIdAndUpdate(id, {
         password: hashedPassword
        })
        responseReturn(res, 201, { message: "password berhasil diganti"})
      }
      catch(error){
        responseReturn(res,500, {error:error.message})
      }
    }

    const change_password_user = async (req, res) =>{
      const {id} = req
        const {oldPassword, newPassword} = req.body
        try{
          const customer= await customerModel.findById(id).select("+password")
          if (!customer) {
            return responseReturn(res, 404, { error: "customer tidak ditemukan" });
          }
          const match = await bcrypt.compare(oldPassword, customer.password);
          if(!match){
            return responseReturn(res, 400, {error: "password lama tidak sesuai"})
          }
   
          const hashedPassword = await bcrypt.hash(newPassword, 10)
          await customerModel.findByIdAndUpdate(id, {
           password: hashedPassword
          })
          responseReturn(res, 201, { message: "password berhasil diganti"})
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
  customer_login,
  customer_register,
  seller_register,
  upload_image_profile,
  add_info_profile,
  update_info_profile_seller,
  change_password_seller,
  change_password_user,
  update_info_profile_store
};
