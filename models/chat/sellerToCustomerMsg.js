const { Schema, model } = require("mongoose");
const sellerSchema = new Schema(
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
      receiverName: {
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

module.exports = model("sellers", sellerSchema);
