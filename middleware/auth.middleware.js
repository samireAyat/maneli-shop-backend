import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // بررسی وجود Authorization
    if (!authHeader) {
      return res.status(401).json({
        message: "لطفاً وارد حساب کاربری شوید",
        Status: 'danger',
        ErorCode:600
      });
    }

    // باید به شکل Bearer TOKEN باشد
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        message: "فرمت توکن نامعتبر است",
        Status: 'danger',
        ErorCode:601,
      
      });
    }

    const token = parts[1];

    // بررسی JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // اطلاعات کاربر را روی request قرار می‌دهیم
    req.user = decoded;

    next();

  } catch (error) {

    console.error("Auth middleware error:", error);

    return res.status(401).json({
      message: "توکن نامعتبر یا منقضی شده است",
      Status: 'danger',
      ErorCode:602
    });

  }
};

export default authMiddleware;