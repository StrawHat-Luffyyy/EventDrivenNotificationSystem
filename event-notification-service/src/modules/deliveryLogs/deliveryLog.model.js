import mongoose from "mongoose";

const deliveryLogSchema = new mongoose.Schema(
  {
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Notification",
    },
    channel: {
      type: String,
      enum: ["IN_APP", "EMAIL", "PUSH"],
      required: true,
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "RETRYING"],
      default: "RETRYING",
    },
    attemptCount: {
      type: Number,
      default: 0,
    },
    errorMessage: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("DeliveryLog", deliveryLogSchema);
