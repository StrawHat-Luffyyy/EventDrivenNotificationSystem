import mongoose from "mongoose";

const preferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },
    channels: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
    eventTypes: {
      type: Map,
      of: boolean,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model("UserPreference", preferenceSchema);
