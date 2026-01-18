import Notification from "./notification.model.js";

export const getNotification = async (req, res) => {
  const userId = req.user.userId;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const isRead = req.query.isRead;

  const query = { userId };
  if (isRead !== undefined) {
    query.isRead = isRead === "true";
  }

  try {
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Notification.countDocuments(query);
    res.status(200).json({
      page,
      limit,
      total,
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
  try {
    await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        userId,
      },
      { $set: { isRead: true } },
    );
    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
