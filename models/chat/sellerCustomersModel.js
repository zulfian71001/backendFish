const { Schema, model } = require("mongoose");
const sellerCustomersSchema = new Schema(
  {
    myId: {
      type: String,
      required: true,
    },
    myFriend: {
      type: Array,
      default:[]
    },
  },
  { timestamps: true }
);

module.exports = model("seller_customers", sellerCustomersSchema);
