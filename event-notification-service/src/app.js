import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import connectDB from "./config/db.js";
import userRoutes from "./modules/users/user.routes.js";
import eventRoutes from "./modules/events/event.routes.js";
import { apiRateLimiter } from "./middlewares/rateLimit.middleware.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json({ limit: "50kb" }));
app.use(helmet());

// health check endpoint
app.get("/health", (req, res) => {
  res.status(200).send("Event Notification Service is running");
});

app.use(apiRateLimiter);

app.use("/auth", userRoutes);
app.use("/events", eventRoutes);
app.use("/notifications", notificationRoutes);

await connectDB();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
