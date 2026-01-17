export const getNotificationContent = (eventType, payload) => {
  switch (eventType) {
    case "ORDER_PLACED":
      return {
        title: "Order Placed Successfully",
        message: `Your order with ID ${payload.orderId} has been placed successfully.`,
      };
    case "PAYMENT_FAILED":
      return {
        title: "Payment Failed",
        message: `Your payment for order ID ${payload.orderId} has failed. Please try again.`,
      };
    default:
      return {
        title: "New Notification",
        message: "You have a new notification.",
      };
  }
};
