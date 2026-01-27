import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import http from "http"; 
import { initSocket } from "./socket.js";
import connectDB from "./config/db.js";
import userRoutes from "./modules/users/user.routes.js";
import eventRoutes from "./modules/events/event.routes.js";
import notificationRoutes from "./modules/notifications/notification.routes.js"; // ✅ Added
import { 
  apiRateLimiter, 
  authRateLimiter,
  eventCreationRateLimiter,
  notificationRateLimiter 
} from "./middlewares/rateLimit.middleware.js";

dotenv.config();
await connectDB();

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));

app.use(express.json({ limit: "50kb" }));
app.use(helmet());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ 
    success: true,
    message: "Event Notification Service is running",
    timestamp: new Date().toISOString(),
  });
});

// Apply rate limiters
app.use("/auth/login", authRateLimiter);
app.use("/auth/register", authRateLimiter);
app.use("/events", eventCreationRateLimiter);
app.use("/notifications", notificationRateLimiter);
app.use(apiRateLimiter); // General rate limiter for all routes

// Routes
app.use("/auth", userRoutes);
app.use("/events", eventRoutes);
app.use("/notifications", notificationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: "Route not found" 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Initialize HTTP server with Socket.io
const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server with Socket.io running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});