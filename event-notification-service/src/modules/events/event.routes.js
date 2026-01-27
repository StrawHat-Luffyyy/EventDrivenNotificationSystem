import express from "express";
import { createEvent , getEventStatus} from "./event.controller.js";
import { internalAuthMiddleware } from "../../middlewares/internalAuth.middleware.js";

const router = express.Router();
router.post("/", internalAuthMiddleware, createEvent);
router.get("/:eventId", internalAuthMiddleware, getEventStatus);
export default router;
