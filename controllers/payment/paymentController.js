const responseReturn = require("../../utils/response.js");
const customerOrder = require("../../models/customerOrder.js");
const midtransClient = require("midtrans-client");
const crypto = require("crypto");
const process_transaction = async (req, res) => {
  const { id, paymentMethod } = req.body;
  try {
    const orderData = await customerOrder.findById(id);
    console.log(orderData);

    const snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });

    let taxAmount = 0;

    if (paymentMethod === "bri_va" || paymentMethod === "bni_va" || paymentMethod === "bca_va") {
      taxAmount = 9000;
    } else if (paymentMethod === "gopay") {
      taxAmount = orderData.price * 0.02 + 2500;
    }

    const payload = {
      transaction_details: {
        order_id: orderData._id,
        gross_amount: orderData.price + taxAmount,
      },
      item_details: [
        {
          id: orderData._id,
          price: orderData.price,
          quantity: 1,
          name: "Order Payment",
        },
        {
          id: "tax",
          price: taxAmount,
          quantity: 1,
          name: "Tax",
        },
      ],
      enabled_payments: [,
        "bri_va",
        "gopay",
      ],
    };

    const token = await snap.createTransactionToken(payload);
    console.log(token);
    responseReturn(res, 201, { token });
  } catch (error) {
    responseReturn(res, 500, { error: error.message });
  }
};

const statusMidtransResponse = async (orderId, data) => {
  const hash = crypto
    .createHash("sha512")
    .update(
      `${orderId}${data.status_code}${data.gross_amount}${process.env.MIDTRANS_SERVER_KEY}`
    )
    .digest("hex");
  if (data.signature_key !== hash) {
    return {
      status: "error",
      message: "invalid signature key",
    };
  }
  let responseData = null;
  let transactionStatus = data.transaction_status;
  let fraudStatus = data.fraud_status;
  if (transactionStatus == "capture") {
    if (fraudStatus == "accept") {
      const transaction = await transactionService.findByIdAndUpdate(orderId, {
        payment_status: "paid",
        payment_method: data.payment_type,
      });
      responseData = transaction;
    }
  } else if (transactionStatus == "settlement") {
    const transaction = await transactionService.findByIdAndUpdate(orderId, {
      payment_status: "paid",
      payment_method: data.payment_type,
    });
    responseData = transaction;
  } else if (
    transactionStatus == "cancel" ||
    transactionStatus == "deny" ||
    transactionStatus == "expire"
  ) {
    const transaction = await transactionService.findByIdAndUpdate(orderId, {
      payment_status: "cancelled",
    });
    responseData = transaction;
  } else if (transactionStatus == "pending") {
    const transaction = await transactionService.findByIdAndUpdate(orderId, {
      payment_status: "unpaid",
    });
    responseData = transaction;
  }
  return {
    status: "success",
    data: responseData,
  };
};

const notification_transaction = async (req, res) => {
  const data = req.body;
  const transaction = await customerOrder.findById(data.orderId);
  if (transaction) {
    statusMidtransResponse(orderId, data).then((data) => {
      console.log(data);
    });
  }
  responseReturn(res, 200, { message: "ok", status: "success" });
};

module.exports = { process_transaction, notification_transaction };
