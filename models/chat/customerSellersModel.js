const { Schema, model } = require("mongoose");
const customerSellersSchema = new Schema(
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

module.exports = model("customer_sellers", customerSellersSchema);
