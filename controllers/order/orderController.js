const cartModel = require("../../models/cartModel");
const categoryModel = require("../../models/categoryModel");
const customerOrder = require("../../models/customerOrder");
const authOrderModel = require("../../models/authOrderModel");
const responseReturn = require("../../utils/response");
const moment = require("moment");
require("moment/locale/id");
const {
  mongo: { ObjectId },
} = require("mongoose");
const ProductModel = require("../../models/productModel");

const paymentCheck = async (id) => {
  try {
    const order = await customerOrder.findById(id);

    if (!order) {
      throw new Error(`Order with id ${id} not found.`);
    }

    if (
      order.payment_method === "transfer" &&
      order.payment_status === "unpaid"
    ) {
      // Restore stock for each product in the cancelled order
      for (let i = 0; i < order.products.length; i++) {
        const productInfo = order.products[i];
        const productId = productInfo._id;
        const quantity = productInfo.quantity;

        const product = await ProductModel.findById(productId);
        if (product) {
          product.stock += quantity;
          await product.save();
        } else {
          throw new Error(`Product with id ${productId} not found.`);
        }
      }

      await customerOrder.findByIdAndUpdate(id, {
        delivery_status: "cancelled",
      });

      await authOrderModel.updateMany(
        { orderId: id },
        { delivery_status: "cancelled" }
      );

      console.log(
        `Order ${id} has been cancelled and stock has been restored.`
      );
    }

    return true; // Return true indicating successful check (not cancellation)
  } catch (error) {
    console.error(`Error checking payment for order ${id}: ${error.message}`);
    throw error;
  }
};

const place_order = async (req, res) => {
  const { price, products, shipping_fee, shippingInfo, userId } = req.body;
  let authorOrderData = [];
  let cartId = [];
  let payment_method = shippingInfo.payment;
  moment.locale("id");
  const tempDate = moment().format("LLL");
  let customerOrderProduct = [];

  try {
    for (let i = 0; i < products.length; i++) {
      const pro = products[i].products;
      for (let j = 0; j < pro.length; j++) {
        let tempCusPro = pro[j].productInfo;
        tempCusPro.quantity = pro[j].quantity;
        customerOrderProduct.push(tempCusPro);
        if (pro[j]._id) {
          cartId.push(pro[j]._id);
        }

        // Decrease stock
        const product = await ProductModel.findById(tempCusPro._id);
        if (product) {
          product.stock -= pro[j].quantity;
          await product.save();
        }
      }
    }

    const order = await customerOrder.create({
      customerId: userId,
      shippingInfo,
      products: customerOrderProduct,
      price: price + shipping_fee,
      payment_method: payment_method,
      delivery_status: "pending",
      payment_status: "unpaid",
      date: tempDate,
    });

    for (let i = 0; i < products.length; i++) {
      const pro = products[i].products;
      const pri = products[i].price;
      const sellerId = products[i].sellerId;
      const shopName = products[i].shopName;
      let storePro = [];
      for (let j = 0; j < pro.length; j++) {
        let tempPro = pro[j].productInfo;
        tempPro.quantity = pro[j].quantity;
        storePro.push(tempPro);
      }
      authorOrderData.push({
        orderId: order.id,
        sellerId,
        products: storePro,
        price: pri,
        payment_status: "unpaid",
        payment_method: payment_method,
        shippingInfo: shopName,
        delivery_status: "pending",
        date: tempDate,
      });
    }

    await authOrderModel.insertMany(authorOrderData);
    for (let k = 0; k < cartId.length; k++) {
      await cartModel.findByIdAndDelete(cartId[k]);
    }

    setTimeout(() => {
      paymentCheck(order.id);
    }, 600000);

    return responseReturn(res, 201, {
      message: "Order berhasil dibuat",
      orderId: order.id,
      order,
    });
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};

const get_orders = async (req, res) => {
  const { perPage, page } = req.query;
  const skipPage = parseInt(perPage) * (parseInt(page) - 1);
  const { customerId, status } = req.params;
  try {
    let orders = [];
    if (perPage && page) {
      orders = await customerOrder
        .find({ customerId: new ObjectId(customerId) })
        .skip(skipPage)
        .limit(parseInt(perPage))
        .sort({ createdAt: -1 });
      totalOrders = await customerOrder
        .find({ customerId: new ObjectId(customerId) })
        .countDocuments();

      if (status !== "all") {
        orders = await customerOrder.find({
          customerId: new ObjectId(customerId),
          delivery_status: status,
        });
        totalOrders = await customerOrder
          .find({
            customerId: new ObjectId(customerId),
            delivery_status: status,
          })
          .countDocuments();
      }
    }
    return responseReturn(res, 200, { orders, totalOrders });
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};

const get_admin_orders = async (req, res) => {
  const { perPage, searchValue, page } = req.query;
  const skipPage = parseInt(perPage) * (parseInt(page) - 1);
  let matchStage = {};
  try {
    if (searchValue && searchValue.trim() !== "") {
      const searchRegex = new RegExp(searchValue, "i");
      matchStage = {
        $match: {
          $or: [
            { delivery_status: searchRegex },
            { orderId: searchRegex },
            { productDetails: searchRegex },
          ],
        },
      };
      const orders = await customerOrder.aggregate([
        matchStage,
        {
          $lookup: {
            from: "authorders",
            localField: "_id",
            foreignField: "orderId",
            as: "suborder",
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $skip: skipPage,
        },
        {
          $limit: parseInt(perPage),
        },
      ]);

      const totalOrders = await customerOrder.aggregate([
        matchStage,
        {
          $lookup: {
            from: "authorders",
            localField: "_id",
            foreignField: "orderId",
            as: "suborder",
          },
        },
      ]);

      responseReturn(res, 200, { orders, totalOrders: totalOrders.length });
    } else if (searchValue === " " && perPage && page) {
      const orders = await customerOrder
        .aggregate([
          {
            $lookup: {
              from: "authorders",
              localField: "_id",
              foreignField: "orderId",
              as: "suborder",
            },
          },
        ])
        .skip(skipPage)
        .limit(parseInt(perPage))
        .sort({ createdAt: -1 });
      const totalOrders = await customerOrder.aggregate([
        {
          $lookup: {
            from: "authorders",
            localField: "_id",
            foreignField: "orderId",
            as: "suborder",
          },
        },
      ]);

      responseReturn(res, 200, { orders, totalOrders: totalOrders.length });
    } else {
      const orders = await customerOrder
        .aggregate([
          {
            $lookup: {
              from: "authorders",
              localField: "_id",
              foreignField: "orderId",
              as: "suborder",
            },
          },
        ])
        .skip(skipPage)
        .limit(parseInt(perPage))
        .sort({ createdAt: -1 });
      const totalOrders = await customerOrder.aggregate([
        {
          $lookup: {
            from: "authorders",
            localField: "_id",
            foreignField: "orderId",
            as: "suborder",
          },
        },
      ]);

      responseReturn(res, 200, { orders, totalOrders: totalOrders.length });
    }
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};

const get_seller_orders = async (req, res) => {
  const { sellerId } = req.params;
  const { perPage, searchValue, page } = req.query;
  const skipPage = parseInt(perPage) * (parseInt(page) - 1);
  try {
    if (searchValue && perPage && page) {
      const orders = await authOrderModel
        .find({ sellerId, $text: { $search: searchValue } })
        .skip(skipPage)
        .limit(parseInt(perPage))
        .sort({ createdAt: -1 });
      const totalOrders = await authOrderModel
        .find({ sellerId, $text: { $search: searchValue } })
        .countDocuments();
      responseReturn(res, 200, { orders, totalOrders });
    } else if (searchValue === " " && perPage && page) {
      const orders = await authOrderModel
        .find({ sellerId })
        .skip(skipPage)
        .limit(parseInt(perPage))
        .sort({ createdAt: -1 });
      const totalOrders = await authOrderModel
        .find({ sellerId })
        .countDocuments();

      responseReturn(res, 200, { orders, totalOrders });
    } else {
      const orders = await authOrderModel
        .find({ sellerId })
        .skip(skipPage)
        .limit(parseInt(perPage))
        .sort({ createdAt: -1 });
      const totalOrders = await authOrderModel
        .find({ sellerId })
        .countDocuments();

      responseReturn(res, 200, { orders, totalOrders });
    }
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};

const get_customer_dashboard_data = async (req, res) => {
  const { userId } = req.params;
  try {
    const recentOrders = await customerOrder
      .find({
        customerId: new ObjectId(userId),
      })
      .limit(3)
      .sort({ createdAt: -1 });
    const totalOrders = await customerOrder
      .find({
        customerId: new ObjectId(userId),
      })
      .countDocuments();
    const pendingOrder = await customerOrder
      .find({
        customerId: new ObjectId(userId),
        delivery_status: "pending",
      })
      .countDocuments();
    const cancelledOrder = await customerOrder
      .find({
        customerId: new ObjectId(userId),
        delivery_status: "cancelled",
      })
      .countDocuments();
    return responseReturn(res, 200, {
      recentOrders,
      totalOrders,
      pendingOrder,
      cancelledOrder,
    });
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};

const get_admin_dashboard_data = async (req, res) => {
  try {
    const recentOrders = await customerOrder
      .find({})
      .limit(3)
      .sort({ createdAt: -1 });
    const totalOrders = await customerOrder.find({}).countDocuments();
    const pendingOrder = await customerOrder
      .find({
        delivery_status: "pending",
      })
      .countDocuments();
    const cancelledOrder = await customerOrder
      .find({
        delivery_status: "cancelled",
      })
      .countDocuments();
    return responseReturn(res, 200, {
      recentOrders,
      totalOrders,
      pendingOrder,
      cancelledOrder,
    });
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};

const get_seller_dashboard_data = async (req, res) => {
  const { userId } = req.params;
  try {
    const recentOrders = await authOrderModel
      .find({
        sellerId: new ObjectId(userId),
      })
      .limit(3)
      .sort({ createdAt: -1 });
    const totalOrders = await authOrderModel
      .find({
        sellerId: new ObjectId(userId),
      })
      .countDocuments();
    const pendingOrder = await authOrderModel
      .find({
        sellerId: new ObjectId(userId),
        delivery_status: "pending",
      })
      .countDocuments();
    const cancelledOrder = await authOrderModel
      .find({
        sellerId: new ObjectId(userId),
        delivery_status: "cancelled",
      })
      .countDocuments();
    return responseReturn(res, 200, {
      recentOrders,
      totalOrders,
      pendingOrder,
      cancelledOrder,
    });
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};

const get_order = async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await customerOrder.findById(orderId);
    return responseReturn(res, 200, { order });
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};

const midtransClient = require("midtrans-client");

const update_status_customer_acceptance = async (req, res) => {
  const { orderId } = req.params;
  const { customer_acceptance } = req.body;
  try {
    // Update customer acceptance status in customerOrder
    const order = await customerOrder.findByIdAndUpdate(
      orderId,
      {
        customer_acceptance: customer_acceptance,
      },
      { new: true }
    );

    if (!order) {
      return responseReturn(res, 404, { message: "Order not found" });
    }

    const sellerOrder = await authOrderModel.findOne({ orderId });

    if (!sellerOrder) {
      return responseReturn(res, 404, { message: "Seller order not found" });
    }

    const updateSellerOrder = await authOrderModel.findByIdAndUpdate(
      sellerOrder._id,
      {
        customer_acceptance: customer_acceptance,
      },
      { new: true }
    );

    console.log(updateSellerOrder);

    const seller = await userInfo.findById(sellerOrder.sellerId); // Assuming sellerId is in sellerOrder
    if (!seller || !seller.shopInfo.noGopay) {
      return responseReturn(res, 404, {
        message: "Seller or GoPay number not found",
      });
    }
    const noGopay = seller.shopInfo.noGopay;

    const apiClient = new midtransClient.CoreApi({
      isProduction: true,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });

    // Disbursement payload
    const disbursementPayload = {
      payment_type: "gopay",
      gopay: {
        transaction_type: "transfer",
        amount: order.price, // Assuming order.price is the amount to be transferred
        phone_number: noGopay,
      },
    };

    // Create a disbursement transaction
    const disbursementResponse = await apiClient.charge(disbursementPayload);
    console.log(disbursementResponse);

    return responseReturn(res, 200, {
      message: "Status updated and funds transferred successfully",
      disbursementResponse,
    });
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};

const get_admin_order = async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await customerOrder.aggregate([
      {
        $match: { _id: new ObjectId(orderId) },
      },
      {
        $lookup: {
          from: "authorders",
          localField: "_id",
          foreignField: "orderId",
          as: "suborder",
        },
      },
    ]);
    return responseReturn(res, 200, { order: order[0] });
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};

const get_seller_order = async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await authOrderModel.findById(orderId);
    return responseReturn(res, 200, { order });
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};

const admin_order_status_update = async (req, res) => {
  const { orderId } = req.params;
  const { status, payment } = req.body;
  try {
    const tempData = await authOrderModel.findById(orderId);
    const orderIdCustomer = tempData.map((order) => order.orderId);
    const order = await authOrderModel.findByIdAndUpdate(orderId, {
      delivery_status: status,
      payment_status: payment,
    });
    const customerOrderUpdate = await customerOrder.findByIdAndUpdate(
      orderIdCustomer,
      {
        delivery_status: status,
        payment_status: payment,
      }
    );
    return responseReturn(res, 200, { message: "status berhasil diperbarui" });
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};
const seller_order_status_update = async (req, res) => {
  const { orderId } = req.params;
  const { status, payment } = req.body;
  try {
    const tempData = await authOrderModel.findById(orderId);
    const orderIdCustomer = tempData.orderId;

    const order = await authOrderModel.findByIdAndUpdate(orderId, {
      delivery_status: status,
      payment_status: payment,
    });
    const customerOrderUpdate = await customerOrder.findByIdAndUpdate(
      orderIdCustomer,
      {
        delivery_status: status,
        payment_status: payment,
      }
    );
    return responseReturn(res, 200, { message: "status berhasil diperbarui" });
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};

module.exports = {
  place_order,
  get_orders,
  get_customer_dashboard_data,
  get_order,
  get_admin_orders,
  get_admin_order,
  admin_order_status_update,
  get_seller_orders,
  get_seller_order,
  seller_order_status_update,
  update_status_customer_acceptance,
  get_admin_dashboard_data,
  get_seller_dashboard_data,
};
