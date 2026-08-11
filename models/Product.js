import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    Name: {
      type: String,
      required: true,
      trim: true,
    },

    Price: {
      type: Number,
      required: true,
    },

    Description: {
      type: String,
      default: "",
    },

    Category: {
      type: String,
      required: false,
    },

    Images: {
      type: [String],
      default: [],
    },

    Sizes: {
      type: [String],
      default: [],
    },

    Colors: {
      type: [String],
      default: [],
    },

    Stock: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const Product = mongoose.model("Product", productSchema);

export default Product;
