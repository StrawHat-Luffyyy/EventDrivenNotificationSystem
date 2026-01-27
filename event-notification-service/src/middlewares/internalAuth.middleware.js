export const internalAuthMiddleware = (req, res, next) => {
  const token = req.headers["x-internal-token"];

  // Check if INTERNAL_SERVICE_TOKEN is configured
  if (!process.env.INTERNAL_SERVICE_TOKEN) {
    console.error("INTERNAL_SERVICE_TOKEN not configured!");
    return res.status(500).json({
      success: false,
      message: "Internal authentication not configured",
    });
  }

  // Validate token
  if (!token || token !== process.env.INTERNAL_SERVICE_TOKEN) {
    console.warn("Unauthorized internal service access attempt");
    return res.status(403).json({
      success: false,
      message: "Forbidden: Invalid internal token",
    });
  }

  next();
};

export default internalAuthMiddleware;
