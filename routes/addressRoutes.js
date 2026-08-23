import express from "express";

import Address from "../models/Address.js";

import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// =========================
// Get User Addresses
// =========================

router.get("/", authMiddleware, async (req, res) => {
  try {
    const addresses = await Address.find({
      UserID: req.user.id,
    }).sort({
      IsDefault: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      UserID: req.user.id,
      Addresses: addresses,
    });
  } catch (error) {
    console.error("Get addresses error:", error);

    return res.status(500).json({
      message: "خطا در دریافت آدرس‌ها",
      error: error.message,
    });
  }
});

// =========================
// Create Address
// =========================

router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      FirstName,
      LastName,
      Mobile,
      Phone,
      Province,
      City,
      PostalCode,
      Address: addressText,
      IsDefault = false,
      AddressLabel,
    } = req.body;

    // -------------------------
    // Validation
    // -------------------------

    if (
      !FirstName ||
      !LastName ||
      !Mobile ||
      !Province ||
      !City ||
      !PostalCode ||
      !addressText
    ) {
      return res.status(400).json({
        message: "لطفاً تمام اطلاعات ضروری آدرس را وارد کنید",
      });
    }

    // -------------------------
    // Default Address
    // -------------------------

    if (IsDefault) {
      await Address.updateMany(
        {
          UserID: req.user.id,
        },
        {
          $set: {
            IsDefault: false,
          },
        },
      );
    }

    // -------------------------
    // Create
    // -------------------------

    const address = await Address.create({
      UserID: req.user.id,
      FirstName,
      LastName,
      Mobile,
      Phone,
      Province,
      City,
      PostalCode,
      Address: addressText,
      IsDefault,
      AddressLabel,
    });

    return res.status(201).json({
      message: "آدرس با موفقیت ثبت شد",
      address,
    });
  } catch (error) {
    console.error("Create address error:", error);

    return res.status(500).json({
      message: "خطا در ثبت آدرس",
      error: error.message,
    });
  }
});

export default router;
