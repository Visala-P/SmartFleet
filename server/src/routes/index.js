const express = require("express");

const authRoutes = require("./authRoutes");
const vehicleRoutes = require("./vehicleRoutes");
const driverRoutes = require("./driverRoutes");
const shipmentRoutes = require("./shipmentRoutes");
const analyticsRoutes = require("./analyticsRoutes");
const notificationRoutes = require("./notificationRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/drivers", driverRoutes);
router.use("/shipments", shipmentRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/notifications", notificationRoutes);

module.exports = router;
