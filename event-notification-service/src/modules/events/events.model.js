import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: "User",
    },
    payload: {
      type: Object,
      required: true,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSED", "FAILED"],
      default: "PENDING",
    },
  },
  { timestamps: true },
);
// Compound index to optimize queries by userId and eventType
eventSchema.index({ userId: 1, eventType: 1, createdAt: -1 });
// TTL index to auto-delete old processed events after 30 days
eventSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 2592000, // 30 days
    partialFilterExpression: { status: "PROCESSED" },
  },
);

export default mongoose.model("Event", eventSchema);
