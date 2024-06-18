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

const paymentCheck = async (id) => {
  try {
    const order = await customerOrder.findById(id);
    if (order.payment_method == "transfer") {
      if (order.payment_status === "unpaid") {
        await customerOrder.findByIdAndUpdate(id, {
          delivery_status: "cancelled",
        });
        await authOrderModel.updateMany(
          {
            orderId: id,
          },
          {
            delivery_status: "cancelled",
          }
        );
      }
    }
    return true;
  } catch (error) {
    console.log(error.message);
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
  for (let i = 0; i < products.length; i++) {
    const pro = products[i].products;
    for (let j = 0; j < pro.length; j++) {
      let tempCusPro = pro[j].productInfo;
      tempCusPro.quantity = pro[j].quantity;
      customerOrderProduct.push(tempCusPro);
      if (pro[j]._id) {
        cartId.push(pro[j]._id);
      }
    }
  }

  try {
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
        .find({ customerId: new ObjectId(customerId)})
        .skip(skipPage)
        .limit(parseInt(perPage))
        .sort({ createdAt: -1 });
      totalOrders = await customerOrder
        .find({ customerId: new ObjectId(customerId)})
        .countDocuments();

      if (status !== "all") {
        orders = await customerOrder.find({
          customerId: new ObjectId(customerId),
          delivery_status: status,
        });
        totalOrders = await customerOrder
        .find({ customerId: new ObjectId(customerId),
          delivery_status: status})
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
  try {
    if (searchValue && perPage && page) {
      const orders = await customerOrder
        .find({ $text: { $search: searchValue } })
        .skip(skipPage)
        .limit(parseInt(perPage))
        .sort({ createdAt: -1 });
      const totalOrders = await customerOrder
        .find({ $text: { $search: searchValue } })
        .countDocuments();
      responseReturn(res, 200, { orders, totalOrders });
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
    const recentOrders = await customerOrder.find({
      customerId: new ObjectId(userId),
    });
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
    console.log(cancelledOrder);
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

const update_status_customer_acceptance = async (req, res) => {
  const { orderId } = req.params;
  const { customer_acceptance } = req.body;
  try {
    const order = await customerOrder.findByIdAndUpdate(orderId, {
      customer_acceptance: customer_acceptance,
    });
    const sellerOrder = await authOrderModel.find({
      orderId
    });
    const authordersId = sellerOrder.map(order => order._id);
    const updateSellerOrder = await authOrderModel.findByIdAndUpdate(authordersId, {
      customer_acceptance: customer_acceptance,
    });
    console.log(updateSellerOrder);
    return responseReturn(res, 200, { message: "status berhasil diperbarui" });
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
    const tempData = await authOrderModel.findById(orderId)
    const orderIdCustomer = tempData.map(order => order.orderId);
    const order = await authOrderModel.findByIdAndUpdate(orderId, {
      delivery_status: status,
      payment_status: payment,
    });
    const customerOrderUpdate = await customerOrder.findByIdAndUpdate(orderIdCustomer, {
      delivery_status: status,
      payment_status: payment,
    });
    return responseReturn(res, 200, { message: "status berhasil diperbarui" });
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};
const seller_order_status_update = async (req, res) => {
  const { orderId } = req.params;
  const { status, payment } = req.body;
  try {
    const tempData = await authOrderModel.findById(orderId)
    const orderIdCustomer = tempData.orderId;

    const order = await authOrderModel.findByIdAndUpdate(orderId, {
      delivery_status: status,
      payment_status: payment,
    });
    const customerOrderUpdate = await customerOrder.findByIdAndUpdate(orderIdCustomer, {
      delivery_status: status,
      payment_status: payment,
    });
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
  update_status_customer_acceptance
};
