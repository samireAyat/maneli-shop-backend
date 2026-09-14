import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import authMiddleware from './../middleware/auth.middleware.js'

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { Name, Email, Password, Role } = req.body;
    console.log("REQ BODY:", req.body);

    // بررسی اطلاعات ارسالی
    if (!Name || !Email || !Password) {
      return res.status(400).json({
        message: "نام، ایمیل و رمز عبور الزامی هستند",
      });
    }

    // بررسی وجود کاربر
    const existingUser = await User.findOne({ Email });

    if (existingUser) {
      return res.status(409).json({
        message: "این ایمیل قبلاً ثبت شده است",
      });
    }

    // Hash کردن password
    const hashedPassword = await bcrypt.hash(Password, 10);

    // ایجاد کاربر
    const user = await User.create({
      Name,
      Email,
      Password: hashedPassword,
      Role,
    });

    // Password را در response برنگردان
    res.status(201).json({
      Message: "ثبت‌نام با موفقیت انجام شد",
      User: {
        id: user._id,
        Name: user.Name,
        Email: user.Email,
        Role: user.Role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      message: "خطا در ثبت‌نام",
      error: error.message,
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { Email, Password } = req.body;

    // بررسی ورودی‌ها
    if (!Email || !Password) {
      return res.status(400).json({
        message: "ایمیل و رمز عبور الزامی هستند",
      });
    }

    // پیدا کردن کاربر
    const user = await User.findOne({ Email });

    if (!user) {
      return res.status(401).json({
        message: "ایمیل یا رمز عبور اشتباه است",
      });
    }

    // بررسی password
    const isPasswordCorrect = await bcrypt.compare(Password, user.Password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "ایمیل یا رمز عبور اشتباه است",
      });
    }

    // ساخت JWT
    const Token = jwt.sign(
      {
        id: user._id,
        role: user.Role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "2h",
      },
    );

    // پاسخ
    res.json({
      Message: "success",
      Token,
      User: {
        id: user._id,
        Name: user.Name,
        Email: user.Email,
        Role: user.Role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "خطا در ورود",
      error: error.message,
    });
  }
});

router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { Name, LastName, NationalCode, PhoneNumber, Email, BirthDate } =
      req.body;

    // بررسی فیلدهای ضروری
    if (
      !Name ||
      !LastName ||
      !NationalCode ||
      !PhoneNumber ||
      !Email ||
      !BirthDate
    ) {
      return res.status(400).json({
        message: "تکمیل تمام اطلاعات الزامی است",
        Status: "danger",
      });
    }

    // بررسی وجود کاربر
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "کاربر پیدا نشد",
        Status: "danger",
      });
    }

    // اگر Email تغییر کرده، بررسی تکراری نبودن آن
    if (Email !== user.Email) {
      const existingUser = await User.findOne({
        Email,
        _id: { $ne: req.user.id },
      });

      if (existingUser) {
        return res.status(409).json({
          message: "این ایمیل قبلاً استفاده شده است",
          Status: "danger",
        });
      }
    }

    // بروزرسانی اطلاعات
    user.Name = Name;
    user.LastName = LastName;
    user.NationalCode = NationalCode;
    user.PhoneNumber = PhoneNumber;
    user.Email = Email;
    user.BirthDate = BirthDate;

    await user.save();

    return res.status(200).json({
      Message: "اطلاعات کاربری با موفقیت بروزرسانی شد",
      Status: "success",
      User: {
        id: user._id,
        Name: user.Name,
        LastName: user.LastName,
        NationalCode: user.NationalCode,
        PhoneNumber: user.PhoneNumber,
        Email: user.Email,
        BirthDate: user.BirthDate,
        Role: user.Role,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      message: "خطا در بروزرسانی اطلاعات کاربری",
      Status: "danger",
      error: error.message,
    });
  }
});

router.get("/profile", authMiddleware, async (req, res) => {
  try {

    const user = await User.findById(req.user.id).select("-Password");

    if (!user) {
      return res.status(404).json({
        message: "کاربر پیدا نشد",
        Status: "danger",
      });
    }

    return res.status(200).json({
      Message: "success",
      User: {
        id: user._id,
        Name: user.Name,
        LastName: user.LastName,
        NationalCode: user.NationalCode,
        PhoneNumber: user.PhoneNumber,
        Email: user.Email,
        BirthDate: user.BirthDate,
        Role: user.Role,
      },
    });

  } catch (error) {

    console.error("Get profile error:", error);

    return res.status(500).json({
      message: "خطا در دریافت اطلاعات کاربر",
      Status: "danger",
      error: error.message,
    });
  }
});

export default router;
