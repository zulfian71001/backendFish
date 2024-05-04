const { Schema, model } = require("mongoose");
const customerSchema = new Schema(
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
      default: "customer",
    },
    image: {
      type: String,
      default: "",
    },
    method: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = model("customers", customerSchema);
