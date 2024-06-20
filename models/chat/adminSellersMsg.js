const { Schema, model } = require("mongoose");
const adminSellerMessageSchema = new Schema(
  {
    senderId: {
      type: String,
      default: '',
    },
    senderName: {
      type: String,
      required: true,
    },
    receiverId: {
        type: String,
        default: '',
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

module.exports = model("seller_admin_messages", adminSellerMessageSchema);
