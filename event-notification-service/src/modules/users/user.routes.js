import express from "express";
import { loginUser } from "./user.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/login", loginUser);
router.get("/protected", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

export default router;
