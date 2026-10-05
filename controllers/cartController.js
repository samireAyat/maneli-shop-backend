import Cart from "../models/CartItem.js";

export const clearCart = async (req, res) => {
  try {
    const userID = req.user.id;

    await Cart.findOneAndUpdate(
      { UserID: userID },
      { $set: { Items: [] } },
      { new: true },
    );

    res.status(200).json({
      success: true,
      message: "سبد خرید با موفقیت خالی شد",
    });
  } catch (error) {
    console.error("Clear Cart Error:", error);

    res.status(500).json({
      success: false,
      message: "خطا در خالی کردن سبد خرید",
      error: error.message,
    });
  }
};
