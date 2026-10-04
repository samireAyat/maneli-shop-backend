import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import Product from "../models/Product.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/products"));
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("فقط تصاویر JPG، PNG و WEBP مجاز هستند"));
    }
  },
});

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const products = await Product.find();

    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: "خطا در دریافت محصولات",
      error: error.message,
    });
  }
});

router.post("/", upload.any(), async (req, res) => {
  try {
    console.log("========== BODY ==========");
    console.log(req.body);

    console.log("========== FILES ==========");
    console.log(req.files);
    // -------------------------
    // Variants
    // -------------------------

    const variants = req.body.Variants ? JSON.parse(req.body.Variants) : [];

    // -------------------------
    // اتصال تصاویر به Variant
    // -------------------------

    variants.forEach((variant, index) => {
      const variantFiles = req.files.filter(
        (file) => file.fieldname === `variantImages_${index}`,
      );

      variant.Images = variantFiles.map(
        (file) => `/uploads/products/${file.filename}`,
      );
    });

    // -------------------------
    // ایجاد محصول
    // -------------------------

    const product = await Product.create({
      Name: req.body.Name,

      Price: Number(req.body.Price),

      Description: req.body.Description ?? "",

      Category: req.body.Category ?? "",

      Variants: variants,
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Create product error:", error);

    res.status(400).json({
      message: "خطا در ایجاد محصول",
      error: error.message,
    });
  }
});

router.get("/search", async (req, res) => {
  try {
    const q = req.query.q?.toString().trim();

    if (!q) {
      return res.json([]);
    }

    const products = await Product.find({
      $or: [
        {
          Name: {
            $regex: q,
            $options: "i"
          }
        },
        {
          Description: {
            $regex: q,
            $options: "i"
          }
        },
        {
          Category: {
            $regex: q,
            $options: "i"
          }
        },
        {
          "Variants.Color": {
            $regex: q,
            $options: "i"
          }
        }
      ]
    }).limit(10);

    res.json(products);

  } catch (error) {
    console.error("Search products error:", error);

    res.status(500).json({
      message: "خطا در جستجوی محصولات",
      error: error.message
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "محصول پیدا نشد",
      });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({
      message: "خطا در دریافت محصول",
      error: error.message,
    });
  }
});

router.put("/:id", upload.any(), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "محصول پیدا نشد",
      });
    }

    // =========================
    // اطلاعات اصلی محصول
    // =========================

    product.Name = req.body.Name;
    product.Price = Number(req.body.Price);
    product.Description = req.body.Description ?? "";
    product.Category = req.body.Category ?? "";

    // =========================
    // Variants
    // =========================

    const variants = req.body.Variants ? JSON.parse(req.body.Variants) : [];

    // =========================
    // فایل‌های جدید
    // =========================

    const files = req.files ?? [];

    variants.forEach((variant, variantIndex) => {
      // فایل‌های جدید این Variant
      const newImages = files
        .filter((file) => file.fieldname === `variantImages_${variantIndex}`)
        .map((file) => `/uploads/products/${file.filename}`);

      // تصاویر قبلی که از فرانت ارسال شده‌اند
      const existingImages = Array.isArray(variant.Images)
        ? variant.Images
        : [];

      // ترکیب تصاویر قبلی + جدید
      variant.Images = [...existingImages, ...newImages];
    });

    // =========================
    // ذخیره Variants
    // =========================

    product.Variants = variants;

    await product.save();

    res.json(product);
  } catch (error) {
    console.error("Update product error:", error);

    res.status(400).json({
      message: "خطا در ویرایش محصول",
      error: error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "محصول پیدا نشد",
      });
    }

    res.json({
      message: "محصول با موفقیت حذف شد",
      product,
    });
  } catch (error) {
    res.status(500).json({
      message: "خطا در حذف محصول",
      error: error.message,
    });
  }
});

export default router;
