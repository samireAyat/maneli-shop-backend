import mongoose from "mongoose";

const productSizeSchema = new mongoose.Schema(
  {

    Name: {
      type: String,
      required: true,
      trim: true,
    },

    Stock: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
);


const productVariantSchema = new mongoose.Schema(
  {

    Color: {
      type: String,
      required: true,
      trim: true,
    },

    Images: {
      type: [String],
      default: [],
    },

    Sizes: {
      type: [productSizeSchema],
      default: [],
    },
  },
);


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
      default: "",
    },

    Variants: {
      type: [productVariantSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);


const Product = mongoose.model("Product", productSchema);

export default Product;