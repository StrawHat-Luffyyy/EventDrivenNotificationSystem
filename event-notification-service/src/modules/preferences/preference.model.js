import mongoose from "mongoose";

const preferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
      index: true,
    },
    channels: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
    eventTypes: {
      type: Map,
      of: Boolean,
      default: {},
    },
    quietHours: {
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: "22:00" }, // Format: "HH:mm"
      endTime: { type: String, default: "08:00" },
    },
    frequency: {
      maxPerHour: { type: Number, default: 10 },
      maxPerDay: { type: Number, default: 100 },
    },
  },
  { timestamps: true },
);

export default mongoose.model("UserPreference", preferenceSchema);
