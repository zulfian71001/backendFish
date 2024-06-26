const { Schema, model } = require("mongoose");
const authOrderSchema = new Schema(
  {
    orderId: {
      type: Schema.ObjectId,
      required: true,
    },
    sellerId: {
        type: Schema.ObjectId,
        required: true,
      },
    products: {
      type: Array,
      required: true,
    },
    price: {
        type: Number,
        required: true,
      },
      payment_status: {
        type: String,
        required: true,
      },
      payment_method: {
        type: String,
        required: true,
      },
      shippingInfo: {
        type: Object,
        required: true,
      },
      delivery_status: {
        type: String,
        required: true,
      },
      customer_acceptance: {
        type: String,
        default: "unreceived",
      },
      date: {
        type: String,
        required: true,
      },
  },
  { timestamps: true }
);

module.exports = model("authOrders", authOrderSchema);
