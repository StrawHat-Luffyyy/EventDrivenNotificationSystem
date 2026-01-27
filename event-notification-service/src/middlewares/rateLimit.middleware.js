import rateLimit from "express-rate-limit";

// General API rate limiter
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

// Strict rate limiter for auth routes
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 attempts
  skipSuccessfulRequests: true, // Don't count successful logins
  message: {
    success: false,
    message: "Too many login attempts, please try again later.",
  },
});

// Rate limiter for event creation
export const eventCreationRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 events per minute per IP
  message: {
    success: false,
    message: "Too many events created, please slow down.",
  },
});

// Rate limiter for notification reads
export const notificationRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    success: false,
    message: "Too many notification requests.",
  },
});