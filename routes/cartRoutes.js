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
// Merge Guest Cart
// =========================

router.post("/merge", authMiddleware, async (req, res) => {
  try {

    const userID = req.user.id;
    const guestItems = req.body.Items;

    // -------------------------
    // Validation
    // -------------------------

    if (!Array.isArray(guestItems) || guestItems.length === 0) {
      return res.status(400).json({
        message: "سبد مهمان خالی است",
      });
    }

    // -------------------------
    // Find / Create Cart
    // -------------------------

    let cart = await Cart.findOne({
      UserID: userID,
    });

    if (!cart) {
      cart = new Cart({
        UserID: userID,
        Items: [],
      });
    }

    // -------------------------
    // Merge Items
    // -------------------------

    for (const guestItem of guestItems) {

      const {
        ProductID,
        VariantID,
        SizeID,
      } = guestItem;

      const Quantity = Number(guestItem.Quantity);

      // -------------------------
      // Item Validation
      // -------------------------

      if (
        !ProductID ||
        !VariantID ||
        !SizeID ||
        !Number.isInteger(Quantity) ||
        Quantity < 1
      ) {
        continue;
      }

      // -------------------------
      // Product
      // -------------------------

      const product = await Product.findById(ProductID);

      if (!product) {
        continue;
      }

      // -------------------------
      // Variant
      // -------------------------

      const variant = product.Variants.find(
        variant =>
          variant._id.toString() === VariantID.toString()
      );

      if (!variant) {
        continue;
      }

      // -------------------------
      // Size
      // -------------------------

      const size = variant.Sizes.find(
        size =>
          size._id.toString() === SizeID.toString()
      );

      if (!size) {
        continue;
      }

      // -------------------------
      // Existing Item
      // -------------------------

      const existingItem = cart.Items.find(
        item =>
          item.ProductID.toString() === ProductID.toString() &&
          item.VariantID.toString() === VariantID.toString() &&
          item.SizeID.toString() === SizeID.toString()
      );

      // -------------------------
      // Calculate Final Quantity
      // -------------------------

      const finalQuantity =
        (existingItem?.Quantity || 0) + Quantity;

      // -------------------------
      // Stock Validation
      // -------------------------

      if (finalQuantity > size.Stock) {
        return res.status(400).json({
          message: `موجودی "${product.Title}" برای این سایز کافی نیست`,
          ProductID,
          VariantID,
          SizeID,
          Stock: size.Stock,
        });
      }

      // -------------------------
      // Update Existing Item
      // -------------------------

      if (existingItem) {

        existingItem.Quantity = finalQuantity;

      }

      // -------------------------
      // Add New Item
      // -------------------------

      else {

        cart.Items.push({
          ProductID,
          VariantID,
          SizeID,
          Quantity,
        });

      }
    }

    // -------------------------
    // Save
    // -------------------------

    await cart.save();

    // -------------------------
    // Response
    // -------------------------

    return res.status(200).json({
      message: "سبد خرید با موفقیت منتقل شد",
      cart,
    });

  } catch (error) {

    console.error("Merge cart error:", error);

    return res.status(500).json({
      message: "خطا در انتقال سبد خرید",
      error: error.message,
    });
  }
});

// =========================
// Get Cart
// =========================
// =========================
// Get Guest Cart
// =========================

router.post("/guest", async (req, res) => {
  try {

    const guestItems = req.body.Items;

    // -------------------------
    // Validation
    // -------------------------

    if (!Array.isArray(guestItems)) {
      return res.status(400).json({
        message: "Guest cart is invalid",
      });
    }

    const items = [];

    // -------------------------
    // Get Product Details
    // -------------------------

    for (const item of guestItems) {

      const {
        ProductID,
        VariantID,
        SizeID,
        Quantity,
      } = item;

      // -------------------------
      // Product
      // -------------------------

      const product = await Product.findById(ProductID);

      if (!product) {
        continue;
      }

      // -------------------------
      // Variant
      // -------------------------

      const variant = product.Variants.find(
        variant =>
          variant._id.toString() === VariantID.toString()
      );

      if (!variant) {
        continue;
      }

      // -------------------------
      // Size
      // -------------------------

      const size = variant.Sizes.find(
        size =>
          size._id.toString() === SizeID.toString()
      );

      if (!size) {
        continue;
      }

      // -------------------------
      // Add Complete Item
      // -------------------------

      items.push({
        ProductID,
        VariantID,
        SizeID,
        Quantity: Number(Quantity),

        Product: product,
        Variant: variant,
        Size: size,
      });
    }

    // -------------------------
    // Response
    // -------------------------

    return res.status(200).json({
      Items: items,
    });

  } catch (error) {

    console.error("Get guest cart error:", error);

    return res.status(500).json({
      message: "خطا در دریافت سبد مهمان",
      error: error.message,
    });
  }
});


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
    const { ProductID, VariantID, SizeID, Quantity } = req.body;

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
    // Find Cart
    // -------------------------

    const cart = await Cart.findOne({
      UserID: req.user.id,
    });

    if (!cart) {
      return res.status(404).json({
        message: "سبد خرید پیدا نشد",
      });
    }

    // -------------------------
    // Find Item
    // -------------------------

    const item = cart.Items.find(
      (item) =>
        item.ProductID.toString() === ProductID &&
        item.VariantID.toString() === VariantID &&
        item.SizeID.toString() === SizeID,
    );

    if (!item) {
      return res.status(404).json({
        message: "آیتم سبد خرید پیدا نشد",
      });
    }

    // -------------------------
    // Find Product
    // -------------------------

    const product = await Product.findById(ProductID);

    if (!product) {
      return res.status(404).json({
        message: "محصول پیدا نشد",
      });
    }

    // -------------------------
    // Find Variant
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
    // Find Size
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

    if (Quantity > size.Stock) {
      return res.status(400).json({
        message: "تعداد انتخابی بیشتر از موجودی است",
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
      item,
    });
  } catch (error) {
    console.error("Update cart error:", error);

    return res.status(500).json({
      message: "خطا در بروزرسانی سبد خرید",
      error: error.message,
    });
  }
});

// =========================
// Remove Cart Item
// =========================

router.delete("/items", authMiddleware, async (req, res) => {
  try {
    const { ProductID, VariantID, SizeID } = req.body;

    if (!ProductID || !VariantID || !SizeID) {
      return res.status(400).json({
        message: "محصول، رنگ و سایز الزامی هستند",
      });
    }

    const cart = await Cart.findOne({
      UserID: req.user.id,
    });

    if (!cart) {
      return res.status(404).json({
        message: "سبد خرید پیدا نشد",
      });
    }

    const itemIndex = cart.Items.findIndex(
      (item) =>
        item.ProductID.toString() === ProductID.toString() &&
        item.VariantID.toString() === VariantID.toString() &&
        item.SizeID.toString() === SizeID.toString(),
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        message: "آیتم سبد خرید پیدا نشد",
      });
    }

    cart.Items.splice(itemIndex, 1);

    await cart.save();

    return res.status(200).json({
      message: "محصول با موفقیت از سبد خرید حذف شد",
      cart,
    });
  } catch (error) {
    console.error("Remove cart item error:", error);

    return res.status(500).json({
      message: "خطا در حذف محصول از سبد خرید",
      error: error.message,
    });
  }
});

export default router;
