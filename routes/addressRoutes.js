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
      status: 200,
      message: "آدرس‌ها با موفقیت دریافت شدند",
      data: {
        UserID: req.user.id,
        Addresses: addresses,
      },
    });

  } catch (error) {
    console.error("Get addresses error:", error);

    return res.status(500).json({
      status: 500,
      message: "خطا در دریافت آدرس‌ها",
      data: null,
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
        status: 400,
        message: "لطفاً تمام اطلاعات ضروری آدرس را وارد کنید",
        data: null,
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
        }
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


    // -------------------------
    // Response
    // -------------------------

    return res.status(201).json({
      status: 201,
      message: "آدرس با موفقیت ثبت شد",
      data: address,
    });

  } catch (error) {

    console.error("Create address error:", error);

    return res.status(500).json({
      status: 500,
      message: "خطا در ثبت آدرس",
      data: null,
    });
  }
});


// =========================
// Update Address
// =========================

router.put("/:addressId", authMiddleware, async (req, res) => {
  try {

    const { addressId } = req.params;

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
        status: 400,
        message: "لطفاً تمام اطلاعات ضروری آدرس را وارد کنید",
        data: null,
      });
    }


    // -------------------------
    // Find Address
    // -------------------------

    const address = await Address.findOne({
      _id: addressId,
      UserID: req.user.id,
    });

    if (!address) {
      return res.status(404).json({
        status: 404,
        message: "آدرس پیدا نشد",
        data: null,
      });
    }


    // -------------------------
    // Default Address
    // -------------------------

    if (IsDefault) {
      await Address.updateMany(
        {
          UserID: req.user.id,
          _id: { $ne: addressId },
        },
        {
          $set: {
            IsDefault: false,
          },
        }
      );
    }


    // -------------------------
    // Update
    // -------------------------

    address.FirstName = FirstName;
    address.LastName = LastName;
    address.Mobile = Mobile;
    address.Phone = Phone;
    address.Province = Province;
    address.City = City;
    address.PostalCode = PostalCode;
    address.Address = addressText;
    address.IsDefault = IsDefault;
    address.AddressLabel = AddressLabel;

    await address.save();


    // -------------------------
    // Response
    // -------------------------

    return res.status(200).json({
      status: 200,
      message: "آدرس با موفقیت ویرایش شد",
      data: address,
    });

  } catch (error) {

    console.error("Update address error:", error);

    return res.status(500).json({
      status: 500,
      message: "خطا در ویرایش آدرس",
      data: null,
    });
  }
});


export default router;