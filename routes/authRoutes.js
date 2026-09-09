import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

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
      Role
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
        expiresIn: "30m"
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

export default router;
