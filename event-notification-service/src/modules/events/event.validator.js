import mongoose from "mongoose";

export const validateEventPayload = ({ userId, payload, eventType }) => {
  // Check required fields
  if (!eventType || !userId || !payload) {
    return "eventType, userId and payload are required.";
  }

  // Validate types
  if (typeof eventType !== "string") {
    return "eventType must be a string.";
  }

  if (typeof payload !== "object" || Array.isArray(payload)) {
    return "payload must be an object";
  }

  // Validate userId format
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return "userId must be a valid ObjectId";
  }

  // Validate eventType format (alphanumeric with underscores)
  if (!/^[A-Z_]+$/.test(eventType)) {
    return "eventType must contain only uppercase letters and underscores (e.g., USER_REGISTERED)";
  }

  // Check eventType length
  if (eventType.length > 50) {
    return "eventType must not exceed 50 characters";
  }

  // Check payload size
  if (JSON.stringify(payload).length > 10_000) {
    return "payload too large (max 10KB)";
  }

  // Check payload keys are valid
  for (const key of Object.keys(payload)) {
    if (typeof key !== "string" || key.length === 0) {
      return "payload keys must be non-empty strings";
    }
  }

  return null;
};

// Add allowed event types (centralized configuration)
export const ALLOWED_EVENT_TYPES = [
  "USER_REGISTERED",
  "USER_LOGIN",
  "ORDER_PLACED",
  "ORDER_SHIPPED",
  "ORDER_DELIVERED",
  "PAYMENT_RECEIVED",
  "PAYMENT_FAILED",
  "PASSWORD_RESET",
  "ACCOUNT_VERIFIED",
  "SUBSCRIPTION_RENEWED",
  "SUBSCRIPTION_CANCELLED",
];

export const isValidEventType = (eventType) => {
  return ALLOWED_EVENT_TYPES.includes(eventType);
};
