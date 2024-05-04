const responseReturn = require("../../utils/response.js");
const customerOrder = require("../../models/customerOrder.js");
const midtransClient = require("midtrans-client");
const crypto = require("crypto");
const process_transaction = async (req, res) => {
  const { id } = req.body;
  try {
    const orderData = await customerOrder.findById(id);
    console.log(orderData);
    const snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });
    const authString = btoa(`${process.env.MIDTRANS_SERVER_KEY}:`);
    const payload = {
      transaction_details: {
        order_id: orderData._id,
        gross_amount: orderData.price,
      },
      enabled_payments: [
        "bca_klikbca",
        "bca_klikpay",
        "bri_epay",
        "bca_va",
        "bni_va",
        "bri_va",
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
  let responseData = null
  let transactionStatus = data.transaction_status
  let fraudStatus = data.fraud_status
  if (transactionStatus == 'capture'){
    if (fraudStatus == 'accept'){
            const transaction = await transactionService.findByIdAndUpdate(orderId,{payment_status:'paid', payment_method:data.payment_type})
            responseData = transaction
        }
    } else if (transactionStatus == 'settlement'){
        const transaction = await transactionService.findByIdAndUpdate(orderId,{payment_status:'paid', payment_method:data.payment_type})
            responseData = transaction
    } else if (transactionStatus == 'cancel' ||
      transactionStatus == 'deny' ||
      transactionStatus == 'expire'){
        const transaction = await transactionService.findByIdAndUpdate(orderId,{payment_status:'cancelled'})
        responseData = transaction
    } else if (transactionStatus == 'pending'){
        const transaction = await transactionService.findByIdAndUpdate(orderId,{payment_status:'unpaid'})
        responseData = transaction
    }
    return {
        status:"success",
        data:responseData
    }
};

const notification_transaction = async (req, res) => {
  const data = req.body;
  const transaction = await customerOrder.findById(data.orderId);
  if (transaction) {
    statusMidtransResponse(orderId, data).then((data) => {
        console.log(data)
    })
  }
  responseReturn(res, 200, { message: "ok", status: "success" });
};

module.exports = { process_transaction, notification_transaction };
