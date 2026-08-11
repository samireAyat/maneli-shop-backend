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

router.post("/", upload.array("images", 10), async (req, res) => {
  try {
    const imageUrls = req.files
      ? req.files.map((file) => `/uploads/products/${file.filename}`)
      : [];

    const product = await Product.create({
      Name: req.body.Name,
      Price: req.body.Price,
      Description: req.body.Description,
      Category: req.body.Category,
      Sizes: req.body.Sizes ? JSON.parse(req.body.Sizes) : [],
      Colors: req.body.Colors ? JSON.parse(req.body.Colors) : [],
      Stock: req.body.Stock,
      Images: imageUrls,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({
      message: "خطا در ایجاد محصول",
      error: error.message,
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

router.put(
  "/:id",
  upload.array("images", 10),
  async (req, res) => {

    try {

      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({
          message: "محصول پیدا نشد",
        });
      }


      // -------------------------
      // اطلاعات محصول
      // -------------------------

      product.Name = req.body.Name;
      product.Price = req.body.Price;
      product.Description = req.body.Description ?? "";
      product.Category = req.body.Category ?? "";
      product.Stock = req.body.Stock ?? 0;


      // -------------------------
      // Sizes
      // -------------------------

      product.Sizes = req.body.Sizes
        ? JSON.parse(req.body.Sizes)
        : [];


      // -------------------------
      // Colors
      // -------------------------

      product.Colors = req.body.Colors
        ? JSON.parse(req.body.Colors)
        : [];


      // -------------------------
      // تصاویر قبلی
      // -------------------------

      const existingImages = req.body.existingImages
        ? JSON.parse(req.body.existingImages)
        : [];


      // -------------------------
      // تصاویر جدید
      // -------------------------

      const newImages = req.files
        ? req.files.map(
            file => `/uploads/products/${file.filename}`
          )
        : [];


      // -------------------------
      // ترکیب تصاویر
      // -------------------------

      product.Images = [
        ...existingImages,
        ...newImages
      ];


      // -------------------------
      // ذخیره
      // -------------------------

      await product.save();


      res.json(product);

    } catch (error) {

      console.error(
        "Update product error:",
        error
      );

      res.status(400).json({
        message: "خطا در ویرایش محصول",
        error: error.message,
      });

    }

  }
);

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
