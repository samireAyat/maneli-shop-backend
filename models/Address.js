import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    UserID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    FirstName: {
      type: String,
      required: true,
      trim: true,
    },

    LastName: {
      type: String,
      required: true,
      trim: true,
    },

    Mobile: {
      type: String,
      required: true,
      trim: true,
    },

    Phone: {
      type: String,
      default: "",
      trim: true,
    },

    Province: {
      type: String,
      required: true,
      trim: true,
    },

    City: {
      type: String,
      required: true,
      trim: true,
    },

    PostalCode: {
      type: String,
      required: true,
      trim: true,
    },

    Address: {
      type: String,
      required: true,
      trim: true,
    },

    IsDefault: {
      type: Boolean,
      default: false,
    },
    AddressLabel: {
      type: String,
      required: false
    }
  },
  {
    timestamps: true,
  },
);

const Address = mongoose.model("Address", addressSchema);

export default Address;
