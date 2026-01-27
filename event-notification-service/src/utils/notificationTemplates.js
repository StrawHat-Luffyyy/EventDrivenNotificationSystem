//  Add all event types with proper templates
export const getNotificationContent = (eventType, payload) => {
  const templates = {
    USER_REGISTERED: {
      title: "Welcome! 🎉",
      message: `Welcome ${payload.username || ""}! Your account has been created successfully.`,
    },
    USER_LOGIN: {
      title: "New Login Detected",
      message: `New login from ${payload.device || "unknown device"} at ${payload.location || "unknown location"}.`,
    },
    ORDER_PLACED: {
      title: "Order Placed Successfully",
      message: `Your order #${payload.orderId} has been placed successfully. Total: ${payload.total || "N/A"}.`,
    },
    ORDER_SHIPPED: {
      title: "Order Shipped 📦",
      message: `Your order #${payload.orderId} has been shipped. Tracking: ${payload.trackingNumber || "N/A"}.`,
    },
    ORDER_DELIVERED: {
      title: "Order Delivered ✅",
      message: `Your order #${payload.orderId} has been delivered successfully.`,
    },
    PAYMENT_RECEIVED: {
      title: "Payment Received",
      message: `Payment of ${payload.amount || "N/A"} received successfully for order #${payload.orderId}.`,
    },
    PAYMENT_FAILED: {
      title: "Payment Failed ⚠️",
      message: `Your payment for order #${payload.orderId} has failed. Reason: ${payload.reason || "Unknown"}. Please try again.`,
    },
    PASSWORD_RESET: {
      title: "Password Reset Request",
      message: `A password reset was requested for your account. Click the link to reset: ${payload.resetLink || "N/A"}`,
    },
    ACCOUNT_VERIFIED: {
      title: "Account Verified ✓",
      message: "Your account has been verified successfully. You now have full access.",
    },
    SUBSCRIPTION_RENEWED: {
      title: "Subscription Renewed",
      message: `Your ${payload.plan || "subscription"} plan has been renewed. Next billing: ${payload.nextBilling || "N/A"}.`,
    },
    SUBSCRIPTION_CANCELLED: {
      title: "Subscription Cancelled",
      message: `Your subscription has been cancelled. You have access until ${payload.expiryDate || "N/A"}.`,
    },
  };

  // ✅ Return template or default
  return templates[eventType] || {
    title: "New Notification",
    message: `You have a new ${eventType.toLowerCase().replace(/_/g, " ")} notification.`,
  };
};

// ✅ Add validation function
export const isValidEventType = (eventType) => {
  const validTypes = [
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
  return validTypes.includes(eventType);
};