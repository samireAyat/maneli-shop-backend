import express from "express";
import Cart from "../models/CartItem.js";
import Product from "../models/Product.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// =========================
// Add To Cart
// =========================

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { ProductID, VariantID, SizeID, Quantity = 1 } = req.body;

    // -------------------------
    // Validation
    // -------------------------

    if (!ProductID || !VariantID || !SizeID) {
      return res.status(400).json({
        message: "محصول، رنگ و سایز الزامی هستند",
      });
    }

    if (Quantity < 1) {
      return res.status(400).json({
        message: "تعداد باید حداقل ۱ باشد",
      });
    }

    // -------------------------
    // Product
    // -------------------------

    const product = await Product.findById(ProductID);

    if (!product) {
      return res.status(404).json({
        message: "محصول پیدا نشد",
      });
    }

    // -------------------------
    // Variant
    // -------------------------

    const variant = product.Variants.find(
      (variant) => variant._id.toString() === VariantID,
    );

    if (!variant) {
      return res.status(404).json({
        message: "رنگ محصول پیدا نشد",
      });
    }

    // -------------------------
    // Size
    // -------------------------

    const size = variant.Sizes.find((size) => size._id.toString() === SizeID);

    if (!size) {
      return res.status(404).json({
        message: "سایز محصول پیدا نشد",
      });
    }

    // -------------------------
    // Stock
    // -------------------------

    if (size.Stock < Quantity) {
      return res.status(400).json({
        message: "موجودی این سایز کافی نیست",
      });
    }

    // -------------------------
    // Find Cart
    // -------------------------

    let cart = await Cart.findOne({
      UserID: req.user.id,
    });

    // اگر Cart وجود نداشت
    if (!cart) {
      cart = new Cart({
        UserID: req.user.id,
        Items: [],
      });
    }

    // -------------------------
    // Existing Item
    // -------------------------

    const existingItem = cart.Items.find(
      (item) =>
        item.ProductID.toString() === ProductID &&
        item.VariantID === VariantID &&
        item.SizeID === SizeID,
    );

    // -------------------------
    // Increase Quantity
    // -------------------------

    if (existingItem) {
      const newQuantity = existingItem.Quantity + Number(Quantity);

      if (newQuantity > size.Stock) {
        return res.status(400).json({
          message: "تعداد انتخابی بیشتر از موجودی است",
        });
      }

      existingItem.Quantity = newQuantity;
    }

    // -------------------------
    // Add New Item
    // -------------------------
    else {
      cart.Items.push({
        ProductID,
        VariantID,
        SizeID,
        Quantity: Number(Quantity),
      });
    }

    // -------------------------
    // Save
    // -------------------------

    await cart.save();

    // -------------------------
    // Response
    // -------------------------

    res.status(200).json({
      message: "محصول با موفقیت به سبد خرید اضافه شد",

      cart,
    });
  } catch (error) {
    console.error("Add to cart error:", error);

    res.status(500).json({
      message: "خطا در افزودن محصول به سبد خرید",

      error: error.message,
    });
  }
});

// =========================
// Get Cart
// =========================

router.get("/", authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({
      UserID: req.user.id,
    });

    if (!cart) {
      return res.status(200).json({
        UserID: req.user.id,
        Items: [],
      });
    }

    const items = [];

    for (const item of cart.Items) {
      const product = await Product.findById(item.ProductID);

      if (!product) {
        continue;
      }

      const variant = product.Variants.find(
        (variant) => variant._id.toString() === item.VariantID.toString(),
      );

      if (!variant) {
        continue;
      }

      const size = variant.Sizes.find(
        (size) => size._id.toString() === item.SizeID.toString(),
      );

      if (!size) {
        continue;
      }

      items.push({
        ID: item._id?.toString(),
        ProductID: item.ProductID,
        VariantID: item.VariantID,
        SizeID: item.SizeID,
        Quantity: item.Quantity,

        Product: product,
        Variant: variant,
        Size: size,
      });
    }

    return res.status(200).json({
      UserID: cart.UserID,
      Items: items,
    });
  } catch (error) {
    console.error("Get cart error:", error);

    return res.status(500).json({
      message: "خطا در دریافت سبد خرید",
      error: error.message,
    });
  }
});

// =========================
// Update Cart Item
// =========================

router.patch("/items", authMiddleware, async (req, res) => {

  try {

    const {
      ProductID,
      VariantID,
      SizeID,
      Quantity
    } = req.body;

    // -------------------------
    // Validation
    // -------------------------

    if (!ProductID || !VariantID || !SizeID) {
      return res.status(400).json({
        message: "محصول، رنگ و سایز الزامی هستند"
      });
    }

    if (Quantity < 1) {
      return res.status(400).json({
        message: "تعداد باید حداقل ۱ باشد"
      });
    }

    // -------------------------
    // Find Cart
    // -------------------------

    const cart = await Cart.findOne({
      UserID: req.user.id
    });

    if (!cart) {
      return res.status(404).json({
        message: "سبد خرید پیدا نشد"
      });
    }

    // -------------------------
    // Find Item
    // -------------------------

    const item = cart.Items.find(
      item =>
        item.ProductID.toString() === ProductID &&
        item.VariantID.toString() === VariantID &&
        item.SizeID.toString() === SizeID
    );

    if (!item) {
      return res.status(404).json({
        message: "آیتم سبد خرید پیدا نشد"
      });
    }

    // -------------------------
    // Find Product
    // -------------------------

    const product = await Product.findById(ProductID);

    if (!product) {
      return res.status(404).json({
        message: "محصول پیدا نشد"
      });
    }

    // -------------------------
    // Find Variant
    // -------------------------

    const variant = product.Variants.find(
      variant =>
        variant._id.toString() === VariantID
    );

    if (!variant) {
      return res.status(404).json({
        message: "رنگ محصول پیدا نشد"
      });
    }

    // -------------------------
    // Find Size
    // -------------------------

    const size = variant.Sizes.find(
      size =>
        size._id.toString() === SizeID
    );

    if (!size) {
      return res.status(404).json({
        message: "سایز محصول پیدا نشد"
      });
    }

    // -------------------------
    // Stock
    // -------------------------

    if (Quantity > size.Stock) {
      return res.status(400).json({
        message: "تعداد انتخابی بیشتر از موجودی است"
      });
    }

    // -------------------------
    // Update
    // -------------------------

    item.Quantity = Number(Quantity);

    await cart.save();

    // -------------------------
    // Response
    // -------------------------

    return res.status(200).json({
      message: "تعداد محصول با موفقیت بروزرسانی شد",
      item
    });

  } catch (error) {

    console.error("Update cart error:", error);

    return res.status(500).json({
      message: "خطا در بروزرسانی سبد خرید",
      error: error.message
    });

  }

});

export default router;
