const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");

const LEGACY_ROLE_BY_NORMALIZED = {
  admin: "Admin",
  transport_manager: "Transport Manager",
  driver: "Driver",
  warehouse_staff: "Warehouse Staff",
};

const NORMALIZED_ROLE_BY_LEGACY = {
  Admin: "admin",
  "Transport Manager": "transport_manager",
  Driver: "driver",
  "Warehouse Staff": "warehouse_staff",
};

const listNotifications = asyncHandler(async (req, res) => {
  const role = req.user.role;
  const legacyRole = LEGACY_ROLE_BY_NORMALIZED[role];
  const items = await Notification.find({
    $or: [
      { audienceRoles: { $size: 0 } },
      { audienceRoles: role },
      ...(legacyRole ? [{ audienceRoles: legacyRole }] : []),
      { audienceRoles: { $exists: false } },
    ],
  }).sort({ createdAt: -1 });

  return res.json(items);
});

const createNotification = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    audienceRoles: Array.isArray(req.body?.audienceRoles)
      ? req.body.audienceRoles.map((role) => NORMALIZED_ROLE_BY_LEGACY[role] || role)
      : req.body?.audienceRoles,
  };

  const item = await Notification.create(payload);
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
