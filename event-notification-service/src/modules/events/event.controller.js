import Event from "./events.model.js";
import { eventQueue } from "../../queues/event.queue.js";
import { validateEventPayload } from "./event.validator.js";

export const createEvent = async (req, res) => {
  try {
    //Enforce JSON only
    if (!req.is("application/json")) {
      return res
        .status(415)
        .json({ error: "Unsupported Media Type. Please send JSON." });
    }

    const { eventType, userId, payload, idempotencyKey } = req.body;
    // Validate event
    const error = validateEventPayload({ eventType, userId, payload });
    if (error) {
      return res.status(400).json({ error });
    }

    // Prevent rapid event spam
    const recentEvent = await Event.findOne({
      userId,
      eventType,
      createdAt: { $gte: new Date(Date.now() - 5000) },
    });

    if (recentEvent) {
      return res.status(429).json({
        message: "Too many similar events. Please slow down.",
      });
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
  } catch (error) {
    console.error("Error creating event:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
