import Order from "../models/OrderItem.js";

export const createOrder = async (req, res) => {
  try {
    const {
      Items,
      TotalAmount,
      TotalCount,
      ShippingAddress,
      PaymentTransactionID,
    } = req.body;

    const userID = req.user.id;
    console.log("REQ.USER:", req.user);

    const order = await Order.create({
      UserID: userID,

      OrderNumber: `ORD-${Date.now()}`,

      Items,

      TotalAmount,

      TotalCount,

      ShippingAddress,

      PaymentStatus: "paid",

      PaymentTransactionID: PaymentTransactionID || "",

      PaidAt: new Date(),

      Status: "processing",
    });

    res.status(201).json({
      success: true,
      message: "سفارش با موفقیت ثبت شد",
      order,
    });
  } catch (error) {
    console.error("Create Order Error:", error);

    res.status(500).json({
      success: false,
      message: "خطا در ثبت سفارش",
      error: error.message,
    });
  }
};


export const getMyOrders = async (req, res) => {
  try {
    const userID = req.user.id;

    const orders = await Order.find({
      UserID: userID,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get My Orders Error:", error);

    res.status(500).json({
      success: false,
      message: "خطا در دریافت سوابق خرید",
      error: error.message,
    });
  }
};