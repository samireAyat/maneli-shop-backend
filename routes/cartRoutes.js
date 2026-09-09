import express from "express";
import Cart from "../models/CartItem.js";
import Product from "../models/Product.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// ==================================================
// Helper: Build Cart Item Response
// ==================================================

const buildCartItem = (product, item) => {
  const variant = product.Variants.find(
    (variant) => variant._id.toString() === item.VariantID.toString(),
  );

  if (!variant) {
    return null;
  }

  const size = variant.Sizes.find(
    (size) => size._id.toString() === item.SizeID.toString(),
  );

  if (!size) {
    return null;
  }

  return {
    ID: item._id?.toString(),

    ProductID: product._id,
    VariantID: variant._id,
    SizeID: size._id,

    Quantity: item.Quantity,

    Product: {
      Name: product.Name,

      Price: product.Price,
    },

    Variant: {
      Color: variant.Color,

      Image: variant.Images?.[0] || null,
    },

    Size: {
      Name: size.Name,
    },
  };
};

// ==================================================
// Add To Cart
// ==================================================

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { ProductID, VariantID, SizeID, Quantity = 1 } = req.body;

    // Validation

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

    // Product

    const product = await Product.findById(ProductID);

    if (!product) {
      return res.status(404).json({
        message: "محصول پیدا نشد",
      });
    }

    // Variant

    const variant = product.Variants.find(
      (variant) => variant._id.toString() === VariantID.toString(),
    );

    if (!variant) {
      return res.status(404).json({
        message: "رنگ محصول پیدا نشد",
      });
    }

    // Size

    const size = variant.Sizes.find(
      (size) => size._id.toString() === SizeID.toString(),
    );

    if (!size) {
      return res.status(404).json({
        message: "سایز محصول پیدا نشد",
      });
    }

    // Stock

    if (size.Stock < Quantity) {
      return res.status(400).json({
        message: "موجودی کافی نیست",
      });
    }

    // Find Cart

    let cart = await Cart.findOne({
      UserID: req.user.id,
    });

    if (!cart) {
      cart = new Cart({
        UserID: req.user.id,

        Items: [],
      });
    }

    // Check Existing Item

    const existingItem = cart.Items.find(
      (item) =>
        item.ProductID.toString() === ProductID.toString() &&
        item.VariantID.toString() === VariantID.toString() &&
        item.SizeID.toString() === SizeID.toString(),
    );

    if (existingItem) {
      const newQuantity = existingItem.Quantity + Number(Quantity);

      if (newQuantity > size.Stock) {
        return res.status(400).json({
          message: "تعداد انتخابی بیشتر از موجودی است",
        });
      }

      existingItem.Quantity = newQuantity;
    } else {
      cart.Items.push({
        ProductID,

        VariantID,

        SizeID,

        Quantity: Number(Quantity),
      });
    }

    await cart.save();

    return res.status(200).json({
      message: "محصول به سبد خرید اضافه شد",

      cartId: cart._id,
    });
  } catch (error) {
    console.error("Add cart error:", error);

    return res.status(500).json({
      message: "خطا در افزودن به سبد خرید",

      error: error.message,
    });
  }
});

// ==================================================
// Get Cart
// ==================================================

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

      const cartItem = buildCartItem(product, item);

      if (cartItem) {
        items.push(cartItem);
      }
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

// ==================================================
// Get Guest Cart
// ==================================================

router.post("/guest", async (req, res) => {
  try {
    const guestItems = req.body.Items;

    if (!Array.isArray(guestItems)) {
      return res.status(400).json({
        message: "سبد خرید مهمان معتبر نیست",
      });
    }

    const items = [];

    for (const item of guestItems) {
      const product = await Product.findById(item.ProductID);

      if (!product) {
        continue;
      }

      const cartItem = buildCartItem(product, item);

      if (cartItem) {
        items.push(cartItem);
      }
    }

    return res.status(200).json({
      Items: items,
    });
  } catch (error) {
    console.error("Guest cart error:", error);

    return res.status(500).json({
      message: "خطا در دریافت سبد مهمان",

      error: error.message,
    });
  }
});

// ==================================================
// Update Cart Quantity
// ==================================================

router.patch("/items", authMiddleware, async (req, res) => {
  try {
    const { ProductID, VariantID, SizeID, Quantity } = req.body;

    // Validation

    if (!ProductID || !VariantID || !SizeID) {
      return res.status(400).json({
        message: "محصول، رنگ و سایز الزامی هستند",
      });
    }

    if (!Number.isInteger(Number(Quantity)) || Quantity < 1) {
      return res.status(400).json({
        message: "تعداد نامعتبر است",
      });
    }

    // Find Cart

    const cart = await Cart.findOne({
      UserID: req.user.id,
    });

    if (!cart) {
      return res.status(404).json({
        message: "سبد خرید پیدا نشد",
      });
    }

    // Find Item

    const item = cart.Items.find(
      (item) =>
        item.ProductID.toString() === ProductID.toString() &&
        item.VariantID.toString() === VariantID.toString() &&
        item.SizeID.toString() === SizeID.toString(),
    );

    if (!item) {
      return res.status(404).json({
        message: "آیتم سبد خرید پیدا نشد",
      });
    }

    // Product

    const product = await Product.findById(ProductID);

    if (!product) {
      return res.status(404).json({
        message: "محصول پیدا نشد",
      });
    }

    // Variant

    const variant = product.Variants.find(
      (variant) => variant._id.toString() === VariantID.toString(),
    );

    if (!variant) {
      return res.status(404).json({
        message: "رنگ محصول پیدا نشد",
      });
    }

    // Size

    const size = variant.Sizes.find(
      (size) => size._id.toString() === SizeID.toString(),
    );

    if (!size) {
      return res.status(404).json({
        message: "سایز محصول پیدا نشد",
      });
    }

    // Stock

    if (Number(Quantity) > size.Stock) {
      return res.status(400).json({
        message: "تعداد انتخابی بیشتر از موجودی است",

        Stock: size.Stock,
      });
    }

    // Update Quantity

    item.Quantity = Number(Quantity);

    await cart.save();

    return res.status(200).json({
      message: "تعداد محصول بروزرسانی شد",

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

// ==================================================
// Remove Cart Item
// ==================================================

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

    const itemIndex = cart.Items.findIndex((item) => {
      return (
        String(item.ProductID) === String(ProductID) &&
        String(item.VariantID) === String(VariantID) &&
        String(item.SizeID) === String(SizeID)
      );
    });

    if (itemIndex === -1) {
      return res.status(404).json({
        message: "آیتم سبد خرید پیدا نشد",
      });
    }

    cart.Items.splice(itemIndex, 1);

    await cart.save();

    return res.status(200).json({
      status: "success",

      message: "محصول از سبد خرید حذف شد",
    });
  } catch (error) {
    console.error("Delete cart error:", error);

    return res.status(500).json({
      message: "خطا در حذف محصول از سبد خرید",

      error: error.message,
    });
  }
});

export default router;
