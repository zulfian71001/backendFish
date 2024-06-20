const { Schema, model } = require("mongoose");
const mapSchema = new Schema(
  {
    sellerId: {
      type: Schema.ObjectId,
      required: true,
    },
    lat: {
      type: String,
      required: true,
    },
    long: {
        type: String,
        required: true,
      },
  },
  { timestamps: true }
);

module.exports = model("maps", mapSchema);
