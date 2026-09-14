import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    Name: {
      type: String,
      required: true,
      trim: true,
    },

    LastName: {
      type: String,
      required: true,
      trim: true,
    },

    NationalCode: {
      type: String,
      required: true,
      trim: true,
    },

    PhoneNumber: {
      type: String,
      required: true,
      trim: true,
    },

    Email: {
      type: String,
      required: false,
      unique: true,
      lowercase: true,
      trim: true,
    },

    BirthDate: {
      type: String,
      required: false,
      trim: true,
    },

    Password: {
      type: String,
      required: true,
    },

    Role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    EmailVerified: {
      type: Boolean,
      default: false,
    },

    EmailVerificationCode: {
      type: String,
      default: null,
    },

    EmailVerificationExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;