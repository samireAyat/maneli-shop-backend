import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    ProductID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    ProductName: {
      type: String,
      required: true,
    },

    Color: {
      type: String,
      default: "",
    },

    Size: {
      type: String,
      default: "",
    },

    Quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    Price: {
      type: Number,
      required: true,
      min: 0,
    },

    Image: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    UserID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    OrderNumber: {
      type: String,
      required: true,
      unique: true,
    },

    Items: {
      type: [orderItemSchema],
      required: true,
    },

    TotalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    TotalCount: {
      type: Number,
      required: true,
      min: 1,
    },

    ShippingAddress: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    Payment: {
      Status: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending",
      },

      TransactionID: {
        type: String,
        default: "",
      },

      PaidAt: {
        type: Date,
        default: null,
      },
    },

    Status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
