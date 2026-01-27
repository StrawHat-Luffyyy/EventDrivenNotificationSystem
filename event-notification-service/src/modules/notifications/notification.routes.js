import express from "express";
import { getNotification, markAsRead , markedasAllRead , deleteAllNotifications } from "./notification.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getNotification);
router.patch("/read", authMiddleware, markAsRead);
router.patch("/read-all", authMiddleware, markedasAllRead);
router.delete("/", authMiddleware, deleteAllNotifications);

export default router;
