const categoryModel = require("../../models/categoryModel");
const productModel = require("../../models/productModel");
const responseReturn = require("../../utils/response");
const QueryProducts = require("../../utils/queryProducts");
const reviewModel = require("../../models/reviewModel");
const moment = require('moment');
require('moment/locale/id'); 
const {
  mongo: { ObjectId },
} = require("mongoose");

const get_categories = async (req, res) => {
  try {
    const categories = await categoryModel.find();
    return responseReturn(res, 200, { categories });
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};
const get_products = async (req, res) => {
  try {
    const products = await productModel.find().sort({ createdAt: -1 });
    return responseReturn(res, 200, { products });
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};
const get_product = async (req, res) => {
  const { productId } = req.params;
  try {
    const product = await productModel.findById(productId);
    responseReturn(res, 200, { product });
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};

const query_products = async (req, res) => {
  const perPage = 8;
  req.query.perPage = perPage;
  try {
    const products = await productModel.find({}).sort({ createdAt: -1 });
    const totalProducts = new QueryProducts(products, req.query)
      .categoryQuery()
      .searchProduct()
      .ratingQuery()
      .sortByPrice()
      .countProducts();

    const result = new QueryProducts(products, req.query)
      .categoryQuery()
      .searchProduct()
      .ratingQuery()
      .sortByPrice()
      .skip()
      .limit()
      .getProducts();

    return responseReturn(res, 200, {
      products: result,
      totalProducts,
      perPage,
    });
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};

const search_products = async (req, res) => {
  const perPage = 8;
  req.query.perPage = perPage;
  try {
    const products = await productModel.find({}).sort({ createdAt: -1 });
    const totalProducts = new QueryProducts(products, req.query)
      .searchProduct()
      .ratingQuery()
      .sortByPrice()
      .countProducts();

    const result = new QueryProducts(products, req.query)
      .searchProduct()
      .ratingQuery()
      .sortByPrice()
      .skip()
      .limit()
      .getProducts();

    console.log(result);
    return responseReturn(res, 200, {
      products: result,
      totalProducts,
      perPage,
    });
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};

const submit_review = async (req, res) => {
  const { productId, review, rating, name } = req.body;
  try {
    moment.locale('id');
    const tempDate = moment().format('LL');
    await reviewModel.create({
      productId,
      review,
      rating,
      name,
      date: tempDate,
    });

    let rat = 0;
    const reviews = await reviewModel.find({ productId });
    for (let i = 0; i < reviews.length; i++) {
      rat = rat + reviews[i].rating;
    }
    let productRating = 0;
    if (reviews.length !== 0) {
      productRating = (rat / reviews.length).toFixed(1);
    }
    await productModel.findByIdAndUpdate(productId, {
      ratings: productRating,
    });

    return responseReturn(res, 201, { message: "Review berhasil dibuat" });
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};

const get_reviews = async (req, res) => {
  const { productId } = req.params;
  const { pageNumber } = req.query;
  const pageNo = parseInt(pageNumber);
  const limit = 5
  const skipPage = (pageNo - 1) * limit
  try {
    let getRating = await reviewModel.aggregate([
      {
        $match:{
          productId:{
            $eq: new ObjectId(productId)
          },
          rating:{
            $not:{
              $size:0
            }
          }
        }
      },
      {
$unwind:'$rating'
      },
      {
$group:{
  _id:"$rating",
  count:{
    $sum:1}
}
      }
    ])
    const rating_review = [
      {
        rating:5,
        sum:0
      },
      {
        rating:4,
        sum:0
      },
      {
        rating:3,
        sum:0
      },
      {
        rating:2,
        sum:0
      },
      {
        rating:1,
        sum:0
      },
      {
        rating:0,
        sum:0
      },
    ]
    for (let i = 0; i < rating_review.length; i++) {
      for (let j = 0; j < getRating.length; j++) {
        if(rating_review[i].rating == getRating[j]._id){
          rating_review[i].sum = getRating[j].count
          break
        }
      }
    }
    
    const getAll = await reviewModel.find({ productId })
    const reviews = await reviewModel.find({ productId }).skip(skipPage).limit(limit).sort({ createdAt: -1 });
    return responseReturn(res, 200, { reviews, totalReviews: getAll.length, rating_review });
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};

module.exports = {
  get_categories,
  get_products,
  get_product,
  query_products,
  search_products,
  submit_review,
  get_reviews
};
