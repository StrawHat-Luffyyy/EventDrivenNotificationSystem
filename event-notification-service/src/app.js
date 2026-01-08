import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import userRoutes from "./modules/users/user.routes.js";
import authMiddleware from "../src/middlewares/auth.middleware.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", userRoutes);

// health check endpoint
app.get("/health", (req, res) => {
  res.status(200).send("Event Notification Service is running");
});

connectDB();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
