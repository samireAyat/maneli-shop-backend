import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import authMiddleware from "./../middleware/auth.middleware.js";
import adminMiddleware from "../middleware/admin.middleware.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { Name, Email, Password, Role } = req.body;
    console.log("REQ BODY:", req.body);

    // بررسی اطلاعات ارسالی
    if (!Name || !Email || !Password) {
      return res.status(400).json({
        Message: "نام، ایمیل و رمز عبور الزامی هستند",
      });
    }

    // بررسی وجود کاربر
    const existingUser = await User.findOne({ Email });

    if (existingUser) {
      return res.status(409).json({
        Message: "این ایمیل قبلاً ثبت شده است",
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
      Message: "خطا در ثبت‌نام",
      error: error.Message,
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { Email, Password } = req.body;

    // بررسی ورودی‌ها
    if (!Email || !Password) {
      return res.status(400).json({
        Message: "ایمیل و رمز عبور الزامی هستند",
      });
    }

    // پیدا کردن کاربر
    const user = await User.findOne({ Email });

    if (!user) {
      return res.status(401).json({
        status: "danger",
        Message: "ایمیل اشتباه است",
      });
    }

    // بررسی password
    const isPasswordCorrect = await bcrypt.compare(Password, user.Password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: "danger",
        Message: "رمز عبور اشتباه است",
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
      Message: "خطا در ورود",
      error: error.Message,
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
        Message: "تکمیل تمام اطلاعات الزامی است",
        Status: "danger",
      });
    }

    // بررسی وجود کاربر
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        Message: "کاربر پیدا نشد",
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
          Message: "این ایمیل قبلاً استفاده شده است",
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
      Message: "خطا در بروزرسانی اطلاعات کاربری",
      Status: "danger",
      error: error.Message,
    });
  }
});

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-Password");

    if (!user) {
      return res.status(404).json({
        Message: "کاربر پیدا نشد",
        Status: "danger",
      });
    }

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
    console.error("Get profile error:", error);

    return res.status(500).json({
      Message: "خطا در دریافت اطلاعات کاربر",
      Status: "danger",
      error: error.Message,
    });
  }
});


router.get("/admin/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      role = "",
    } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 100);

    const skip = (pageNumber - 1) * limitNumber;

    const filter = {};

    // جستجو
    if (search.trim()) {
      filter.$or = [
        { Name: { $regex: search.trim(), $options: "i" } },
        { LastName: { $regex: search.trim(), $options: "i" } },
        { Email: { $regex: search.trim(), $options: "i" } },
        { PhoneNumber: { $regex: search.trim(), $options: "i" } },
        { NationalCode: { $regex: search.trim(), $options: "i" } },
      ];
    }

    // فیلتر Role
    if (role && ["user", "admin"].includes(role)) {
      filter.Role = role;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select(
          "-Password -EmailVerificationCode -EmailVerificationExpires"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),

      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      Message: "لیست کاربران با موفقیت دریافت شد",
      Status: "success",

      Data: users,

      Pagination: {
        Page: pageNumber,
        Limit: limitNumber,
        Total: total,
        TotalPages: Math.ceil(total / limitNumber),
      },
    });

  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      Message: "خطا در دریافت لیست کاربران",
      Status: "danger",
    });
  }
});

export default router;
