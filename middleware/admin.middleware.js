const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      Message: "دسترسی غیرمجاز",
      Status: "danger",
    });
  }

  next();
};

export default adminMiddleware;