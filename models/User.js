import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    Name: {
      type: String,
      required: false,
      trim: true,
    },

    Email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
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
  },
);

const User = mongoose.model("User", userSchema);

export default User;
