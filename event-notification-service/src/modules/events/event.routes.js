import express from "express";
import { createEvent } from "./event.controller.js";
import { internalAuthMiddleware } from "../../middlewares/internalAuth.middleware.js";

const router = express.Router();
router.post("/", internalAuthMiddleware, createEvent);
export default router;
