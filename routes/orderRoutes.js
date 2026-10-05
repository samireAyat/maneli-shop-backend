import express from "express";
import { createOrder,getMyOrders } from "../controllers/orderController.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, createOrder);
router.get("/my-orders", authMiddleware, getMyOrders);

export default router;