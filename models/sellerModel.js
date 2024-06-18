const { Schema, model } = require("mongoose");
const sellerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      default: "seller",
    },
    status: {
      type: String,
      default: "pending",
    },
    payment: {
      type: String,
      default: "inactive",
    },
    image: {
      type: String,
      default: "",
    },
    shopInfo: {
      type: Object,
      required: {},
    },
  },
  { timestamps: true }
);

sellerSchema.index({ name: "text" , email:"text"},{weights:{ name: 5 , email:4}} );


module.exports = model("sellers", sellerSchema);
