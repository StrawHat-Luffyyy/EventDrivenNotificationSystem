import express from "express";
import { getNotification, markAsRead } from "./notification.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getNotification);
router.post("/read", authMiddleware, markAsRead);

export default router;
