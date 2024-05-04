const categoryModel = require("../../models/categoryModel");
const productModel = require("../../models/productModel");
const responseReturn = require("../../utils/response")

const get_categories = async (req,res) =>{
    try{
        const categories = await categoryModel.find();
        return responseReturn(res, 200, { categories });
    }
    catch (error){
        return responseReturn(res, 500, { error: error.message });

    }
}
const get_products = async (req,res) =>{
    try{
        const products = await productModel.find().sort({ createdAt: -1 });
        return responseReturn(res, 200, { products });
    }
    catch (error){
        return responseReturn(res, 500, { error: error.message });

    }
}
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
module.exports = {get_categories, get_products, get_product}