const cartModel = require("../../models/cartModel");
const categoryModel = require("../../models/categoryModel");
const productModel = require("../../models/productModel");
const responseReturn = require("../../utils/response");
const {
  mongo: { ObjectId },
} = require("mongoose");

const add_to_cart = async (req, res) => {
  const { userId, productId, quantity } = req.body;
  try {
    const product = await productModel.findById(productId);
    if (userId == product.sellerId) {
      return responseReturn(res, 404, {
        error: "tidak bisa menambahkan produk sendiri ke dalam cart",
      });
    } else {
      const product = await cartModel.findOne({
        $and: [
          {
            userId: {
              $eq: userId,
            },
          },
          {
            productId: {
              $eq: productId,
            },
          },
        ],
      });
      if (product) {
        return responseReturn(res, 404, {
          error: "produk sudah ditambahkan ke dalam cart",
        });
      } else {
        const product = await cartModel.create({
          userId,
          productId,
          quantity,
        });
        return responseReturn(res, 201, {
          message: "berhasil menambahkan ke dalam cart",
          product,
        });
      }
    }
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};

const get_products_cart = async (req, res) => {
  const co = 5;
  const { userId } = req.params;
  // console.log(userId);
  try {
    const cart_products = await cartModel.aggregate([
      {
        $match: {
          userId: {
            $eq: new ObjectId(userId),
          },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "products",
        },
      },
    ]);
    let buy_item_product = 0;
    let calculatePrice = 0;
    let total_cart_products = 0;
    const outOfStockProducts = cart_products.filter(
      (p) => p.products[0].stock < p.quantity
    );
    for (let i = 0; i < outOfStockProducts.length; i++) {
      total_cart_products =
        total_cart_products + outOfStockProducts[i].quantity;
    }
    const stockProduct = cart_products.filter(
      (p) => p.products[0].stock >= p.quantity
    );
    for (let i = 0; i < stockProduct.length; i++) {
      const { quantity } = stockProduct[i];
      total_cart_products = total_cart_products + quantity;
      buy_item_product = buy_item_product + quantity;
      const { price } = stockProduct[i].products[0];
      calculatePrice = calculatePrice + price * quantity;
    }

    let p = [];
    let unique = [
      ...new Set(stockProduct.map((p) => p.products[0].sellerId.toString())),
    ];
    for (let i = 0; i < unique.length; i++) {
      let price = 0;
      let products = []; // Initialize products array for each seller
      for (let j = 0; j < stockProduct.length; j++) {
        const tempProduct = stockProduct[j].products[0];
        if (unique[i] === tempProduct.sellerId.toString()) {
          let pri = 0;
          pri = tempProduct.price;
          price = price + pri * stockProduct[j].quantity;

          // Add the product to the products array
          products.push({
            _id: stockProduct[j]._id,
            quantity: stockProduct[j].quantity,
            productInfo: tempProduct,
          });
        }
      }

      // Add seller info, price, and products to cart object p
      p.push({
        sellerId: unique[i],
        shopName: products[0].productInfo.shopName, // Assuming all products from the same seller have the same shop name
        price,
        products,
      });
    }

    // console.log(stockProduct[0].products[0].sellerId.toString())
    // console.log(p)
    // console.log(products)
    // console.log(cart_products);
    // console.log(outOfStockProduct);
    // console.log(calculatePrice);
    // console.log(total_cart_products)
    responseReturn(res, 200, {
      userId,
      cart_products: p,
      price: calculatePrice,
      total_cart_products,
      shipping_fee: 10000 * p.length,
      outOfStockProducts,
      buy_item_product,
    });
  } catch (error) {
    console.log(error);
    responseReturn(res, 500, { error: error.message });
  }
};
const delete_products_cart = async (req, res) => {
  const { cartId } = req.params;

  try {
    await cartModel.findByIdAndDelete(cartId);
    responseReturn(res, 200, { message: "berhasil dihapus" });
  } catch (error) {
    console.log(error);
    responseReturn(res, 500, { error: error.message });
  }
};

const quantity_inc = async (req, res) => {
  const { cartId } = req.params;

  try {
    const product = await cartModel.findById(cartId);
    const { quantity } = product;
    await cartModel.findByIdAndUpdate(cartId, {
      quantity: quantity + 1,
    });
    responseReturn(res, 200, { message: "berhasil menambah" });
  } catch (error) {
    console.log(error);
    responseReturn(res, 500, { error: error.message });
  }
};

const quantity_dec = async (req, res) => {
  const { cartId } = req.params;

  try {
    const product = await cartModel.findById(cartId);
    const { quantity } = product;
    await cartModel.findByIdAndUpdate(cartId, {
      quantity: quantity - 1,
    });
    responseReturn(res, 200, { message: "berhasil mengurangi" });
  } catch (error) {
    console.log(error);
    responseReturn(res, 500, { error: error.message });
  }
};

module.exports = {
  add_to_cart,
  get_products_cart,
  delete_products_cart,
  quantity_inc,
  quantity_dec,
};
