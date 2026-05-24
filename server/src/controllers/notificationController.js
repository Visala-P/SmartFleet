const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");

const listNotifications = asyncHandler(async (req, res) => {
  const role = req.user.role;
  const items = await Notification.find({
    $or: [{ audienceRoles: { $size: 0 } }, { audienceRoles: role }, { audienceRoles: { $exists: false } }],
  }).sort({ createdAt: -1 });

  return res.json(items);
});

const createNotification = asyncHandler(async (req, res) => {
  const item = await Notification.create(req.body);
  return res.status(201).json(item);
});

const markRead = asyncHandler(async (req, res) => {
  const item = await Notification.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { isReadBy: req.user._id } },
    { new: true }
  );

  if (!item) return res.status(404).json({ message: "Notification not found" });
  return res.json(item);
});

module.exports = { listNotifications, createNotification, markRead };
