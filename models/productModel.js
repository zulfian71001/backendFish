const { Schema, model } = require("mongoose");
const productSchema = new Schema(
  {
    sellerId: {
        type: Schema.ObjectId,
        required: true,
      },
    name: {
      type: String,
      required: true,
    },
    categoryName: {
        type: String,
        required: true,
      },
      stock: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      desc: {
        type: String,
        required: true,
      },
      shopName: {
        type: String,
        required: true,
      },
    images: {
      type: Array,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    ratings: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

productSchema.index({ name: "text" , catagoryName:"text", desc:"text"},{weights:{ name: 5 , catagoryName:4, desc:2}} );

module.exports = model("products", productSchema);
