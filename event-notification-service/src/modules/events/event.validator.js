export const validateEventPayload = ({ userId, payload, eventType }) => {
  if (!eventType || !userId || !payload) {
    return "eventType , userId and payload are required.";
  }
  if (typeof eventType !== "string") {
    return "eventType must be a string.";
  }
  if (typeof payload !== "object" || Array.isArray(payload)) {
    return "payload must be an object";
  }
  if (JSON.stringify(payload).length > 10_000) {
    return "payload too large";
  }

  return null;
};
