import express from "express";
import Favorite from "../models/Favorite.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const UserID = req.user.id;
    const { ProductID } = req.body;

    console.log("BODY:", req.body);
    console.log("ProductID:", ProductID);
    console.log("UserID:", UserID);

    if (!ProductID) {
      return res.status(400).json({
        message: "ProductID الزامی است",
      });
    }

    const existingFavorite = await Favorite.findOne({
      UserID,
      ProductID,
    });

    if (existingFavorite) {
      return res.status(409).json({
        message: "این محصول قبلاً به علاقه‌مندی‌ها اضافه شده است",
        IsFavorite: true,
      });
    }

    const favorite = new Favorite({
      UserID: UserID,
      ProductID: ProductID,
    });

    console.log("========== FAVORITE DEBUG ==========");
    console.log("ProductID from body:", ProductID);
    console.log("UserID from token:", UserID);
    console.log("Favorite object:", favorite.toObject());
    console.log("Favorite ProductID:", favorite.ProductID);
    console.log("====================================");

    await favorite.save();

    console.log("AFTER SAVE:", favorite.toObject());

    return res.status(201).json({
      message: "محصول به علاقه‌مندی‌ها اضافه شد",
      IsFavorite: true,
      favorite,
      status: 'success'
    });
  } catch (error) {
    console.error("ADD FAVORITE ERROR:", error);

    return res.status(500).json({
      message: "خطا در اضافه کردن محصول به علاقه‌مندی‌ها",
    });
  }
});

router.delete("/:productId", authMiddleware, async (req, res) => {
  try {
    const UserID = req.user.id;
    const { productId } = req.params;

    const result = await Favorite.deleteOne({
      UserID,
      ProductID: productId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "این محصول در علاقه‌مندی‌ها وجود ندارد",
      });
    }

    return res.status(200).json({
      message: "محصول از علاقه‌مندی‌ها حذف شد",
      status: 'success'
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "خطا در حذف علاقه‌مندی",
    });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const UserID = req.user.id;

    const favorites = await Favorite.find({
      UserID,
    }).populate("ProductID");

    console.log("BEFORE POPULATE:", favorites);
    const populatedFavorites = await Favorite.find({ UserID }).populate(
      "ProductID",
    );
    console.log("AFTER POPULATE:", populatedFavorites);
    const items = favorites.map((favorite) => ({
      ...favorite.toObject(),
      IsFavorite: true,
    }));

    return res.status(200).json({
      Items: items,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "خطا در دریافت علاقه‌مندی‌ها",
    });
  }
});

export default router;
