import express from "express";
import { loginUser, registerUser, getCurrentUser } from "./user.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authMiddleware, getCurrentUser); 
router.get("/protected", authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user });
});

export default router;