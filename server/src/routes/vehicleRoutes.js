const express = require("express");
const {
  listVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  maintenanceAlerts,
} = require("../controllers/vehicleController");
const { protect, authorizeRoles } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { vehicleSchema } = require("../validations/vehicleValidation");

const router = express.Router();

router.use(protect);
router.get("/", listVehicles);
router.get("/alerts/maintenance", maintenanceAlerts);
router.get("/:id", getVehicle);
router.post("/", authorizeRoles("Admin", "Transport Manager"), validate(vehicleSchema), createVehicle);
router.put("/:id", authorizeRoles("Admin", "Transport Manager"), updateVehicle);
router.delete("/:id", authorizeRoles("Admin"), deleteVehicle);

module.exports = router;
