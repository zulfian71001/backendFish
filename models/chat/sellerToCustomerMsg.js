const { Schema, model } = require("mongoose");
const sellerCustomerSchema = new Schema(
  {
    senderId: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    receiverId: {
        type: String,
        required: true,
      },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "unseen",
    },
  },
  { timestamps: true }
);

module.exports = model("seller_customer_messages", sellerCustomerSchema);
