import Notification from "./notification.model.js";

export const getNotification = async (req, res) => {
  const userId = req.user.userId;

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(100, parseInt(req.query.limit) || 10);
  const isRead = req.query.isRead;
  const channel = req.query.channel;

  const query = { userId };
  if (isRead !== undefined) {
    query.isRead = isRead === "true";
  }
  if (channel && ["IN_APP", "EMAIL", "PUSH"].includes(channel.toUpperCase())) {
    query.channel = channel.toUpperCase();
  }

  try {
    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
    ]);
    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      notifications,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  const userId = req.user.userId;
  const { notificationIds } = req.body;
  if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
    return res
      .status(400)
      .json({ message: "notificationIds must be a non-empty array" });
  }
  if (notificationIds.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Cannot mark more than 100 notifications at once",
    });
  }
  // Validate ObjectIds
  const mongoose = await import("mongoose");
  const validIds = notificationIds.filter((id) =>
    mongoose.Types.ObjectId.isValid(id),
  );
  if (validIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No valid notification IDs provided",
    });
  }
  try {
    await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        userId,
      },
      { $set: { isRead: true } },
    );
    res.status(200).json({
      success: true,
      message: "Notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

export const markedasAllRead = async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } },
    );
    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

export const deleteAllNotifications = async (req, res) => {
  const userId = req.user.userId;
  const { notificationIds } = req.body;
  if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
    return res
      .status(400)
      .json({ message: "notificationIds must be a non-empty array" });
  }
  try {
    const result = await Notification.deleteMany({
      _id: { $in: notificationIds },
      userId,
    });
    res.status(200).json({
      success: true,
      message: "Notifications deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
