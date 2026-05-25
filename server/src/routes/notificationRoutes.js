const express = require("express");
const { listNotifications, createNotification, markRead } = require("../controllers/notificationController");
const { protect, authorizeRoles } = require("../middlewares/auth");

const router = express.Router();

router.use(protect);
router.get("/", listNotifications);
router.post("/", authorizeRoles("admin", "transport_manager"), createNotification);
router.patch("/:id/read", markRead);

module.exports = router;
