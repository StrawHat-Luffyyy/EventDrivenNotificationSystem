import Event from "./events.model.js";
import { eventQueue } from "../../queues/event.queue.js";
import { validateEventPayload } from "./event.validator.js";
import mongoose from "mongoose";

export const createEvent = async (req, res) => {
  try {
    // Enforce JSON only
    if (!req.is("application/json")) {
      return res.status(415).json({
        success: false,
        error: "Unsupported Media Type. Please send JSON.",
      });
    }

    const { eventType, userId, payload, idempotencyKey } = req.body;

    // Validate event
    const error = validateEventPayload({ eventType, userId, payload });
    if (error) {
      return res.status(400).json({ success: false, error });
    }

    // Validate userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid userId format",
      });
    }

    // Check idempotency
    if (idempotencyKey) {
      const existingEvent = await Event.findOne({ idempotencyKey });
      if (existingEvent) {
        return res.status(200).json({
          success: true,
          message: "Event already processed (idempotent).",
          eventId: existingEvent._id,
          status: existingEvent.status,
        });
      }
    }

    // Prevent rapid event spam (debouncing)
    const recentEvent = await Event.findOne({
      userId,
      eventType,
      createdAt: { $gte: new Date(Date.now() - 5000) }, // 5 seconds
    });

    if (recentEvent) {
      return res.status(429).json({
        success: false,
        message: "Too many similar events. Please slow down.",
        retryAfter: 5, // seconds
      });
    }

    // Save event with try-catch for duplicate key errors
    let event;
    try {
      event = await Event.create({
        eventType,
        userId,
        payload,
        idempotencyKey,
      });
    } catch (dbError) {
      // Handle race condition on idempotency key
      if (dbError.code === 11000 && idempotencyKey) {
        const existingEvent = await Event.findOne({ idempotencyKey });
        return res.status(200).json({
          success: true,
          message: "Event already processed (race condition handled).",
          eventId: existingEvent._id,
          status: existingEvent.status,
        });
      }
      throw dbError; // Re-throw if not idempotency error
    }

    //  Add event to queue with error handling
    try {
      await eventQueue.add(
        "processEvent",
        { eventId: event._id },
        {
          attempts: 10,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
          removeOnComplete: {
            age: 3600, // Keep completed jobs for 1 hour
            count: 1000, // Keep last 1000 completed jobs
          },
          removeOnFail: {
            age: 86400, // Keep failed jobs for 24 hours
          },
        },
      );
    } catch (queueError) {
      console.error("Failed to add event to queue:", queueError);
      // Mark event as failed if queue addition fails
      event.status = "FAILED";
      await event.save();

      return res.status(500).json({
        success: false,
        error: "Failed to queue event for processing",
        eventId: event._id,
      });
    }

    // Respond to client
    return res.status(202).json({
      success: true,
      message: "Event accepted for processing.",
      eventId: event._id,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
};


export const getEventStatus = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid eventId format",
      });
    }

    const event = await Event.findById(eventId).select(
      "eventType status createdAt updatedAt",
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        error: "Event not found",
      });
    }

    res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    console.error("Error fetching event status:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
};
