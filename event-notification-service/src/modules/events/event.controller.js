import Event from "./events.model.js";
import { eventQueue } from "../../queues/event.queue.js";
import { validateEventPayload } from "./event.validator.js";

export const createEvent = async (req, res) => {
  const { eventType, userId, payload, idempotencyKey } = req.body;

  // Validate event
  const error = validateEventPayload({ eventType, userId, payload });
  if (error) {
    return res.status(400).json({ error });
  }

  // Check for idempotency
  if (idempotencyKey) {
    const existingEvent = await Event.findOne({ idempotencyKey });
    if (existingEvent) {
      return res.status(200).json({
        message: "Event already processed.",
        eventId: existingEvent._id,
      });
    }
  }
  //Save event
  const event = await Event.create({
    eventType,
    userId,
    payload,
    idempotencyKey,
  });
  // Add event to queue
  await eventQueue.add("processEvent", { eventId: event._id });

  // Respond to client
  return res.status(202).json({
    message: "Event accepted for processing.",
    eventId: event._id,
  });
};
