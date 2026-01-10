export const validateEventPayload = ({ userId, payload, eventType }) => {
  if (!eventType || !userId || !payload) {
    return "eventType , userId and payload are required.";
  }
  if (typeof eventType !== "string") {
    return "eventType must be a string.";
  }

  return null;
};
