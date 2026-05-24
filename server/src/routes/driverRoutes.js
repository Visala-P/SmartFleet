const express = require("express");
const {
  listDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  driverPerformance,
} = require("../controllers/driverController");
const { protect, authorizeRoles } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { driverSchema } = require("../validations/driverValidation");

const router = express.Router();

router.use(protect);
router.get("/", listDrivers);
router.get("/performance/top", driverPerformance);
router.post("/", authorizeRoles("Admin", "Transport Manager"), validate(driverSchema), createDriver);
router.put("/:id", authorizeRoles("Admin", "Transport Manager"), updateDriver);
router.delete("/:id", authorizeRoles("Admin"), deleteDriver);

module.exports = router;
