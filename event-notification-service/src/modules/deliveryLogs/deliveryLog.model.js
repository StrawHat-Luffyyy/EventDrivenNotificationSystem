import mongoose from "mongoose";

const deliveryLogSchema = new mongoose.Schema(
  {
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Notification",
      index: true,
    },
    channel: {
      type: String,
      enum: ["IN_APP", "EMAIL", "PUSH"],
      required: true,
      index: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "RETRYING"],
      default: "RETRYING",
      index: true,
    },
    attemptCount: {
      type: Number,
      default: 1,
    },
    errorMessage: {
      type: String,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true },
);
deliveryLogSchema.index({ notificationId: 1, channel: 1 });
//TTL index to auto-delete old logs after 90 days
deliveryLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 7776000 }, // 90 days
);
export default mongoose.model("DeliveryLog", deliveryLogSchema);
