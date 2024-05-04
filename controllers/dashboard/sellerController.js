const responseReturn = require("../../utils/response");
const sellerModel = require("../../models/sellerModel");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const upload = multer();

const get_request_seller = async (req, res) => {
  const { page, perPage, searchValue } = req.query;
  console.log({ page, perPage, searchValue });
  const skipPage = parseInt(perPage) * (parseInt(page) - 1);
  try {
    if (searchValue) {
      const sellers = await sellerModel
        .find({ status: "pending" })
        .skip(skipPage)
        .limit(perPage)
        .sort({ createdAt: -1 });
      return responseReturn(res, 200, {
        sellers: sellers,
        totalSellers: totalSellers,
      });
    } else {
      const sellers = await sellerModel
        .find({ status: "pending" })
        .skip(skipPage)
        .limit(perPage)
        .sort({ createdAt: -1 });
      const totalSellers = await sellerModel
        .find({ status: "pending" })
        .countDocuments();
      console.log(sellers);
      return responseReturn(res, 200, {
        sellers: sellers,
        totalSellers: totalSellers,
      });
    }
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};

const get_sellers = async (req, res) =>{
const {searchValue, perPage, page} = req.query
const skipPage = parseInt(perPage) * (parseInt(page) - 1);
  try {
    if (searchValue) {
      const sellers = await sellerModel.find({}).skip(skipPage).limit(perPage).sort({ createdAt: -1 });
      return responseReturn(res, 200, {
        sellers: sellers,
        totalSellers: totalSellers,
      });
    } else {
      const sellers = await sellerModel.find({}).skip(skipPage).limit(perPage).sort({ createdAt: -1 });
      const totalSellers = await sellerModel
        .countDocuments();
      console.log(sellers);
      return responseReturn(res, 200, {
        sellers: sellers,
        totalSellers: totalSellers,
      });
    }
  }
catch(error){
  return responseReturn(res,500, {error:error.message})
}
}

const get_seller = async (req, res) => {
  const { sellerId } = req.params;
  try {
    const seller = await sellerModel.findById(sellerId);
    if (seller) {
      return responseReturn(res, 200, { seller });
    } else {
      return responseReturn(res, 404, { message: "seller tidak ditemukan" });
    }
  } catch (error) {
    console.log(error.message);
    return responseReturn(res, 500, { error: error.message });
  }
};

const update_status_seller = async (req, res) =>{
const {sellerId, status} = req.body
console.log({sellerId, status})
try{
 const seller = await sellerModel.findByIdAndUpdate(sellerId, {
  status
 })
 if(seller){
  return responseReturn(res, 200, {message:"status seller berhasil diperbarui", seller})
 }
 else{
  return responseReturn(res, 404, {message:"update status seller gagal"})
 }
}
catch(error){
  return responseReturn(res,500, {error:error.message})
}
}
module.exports = {
  get_request_seller,
  get_seller,
  update_status_seller,
  get_sellers
};
