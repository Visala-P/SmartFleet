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
router.post("/", authorizeRoles("admin", "transport_manager"), validate(vehicleSchema), createVehicle);
router.put("/:id", authorizeRoles("admin", "transport_manager"), updateVehicle);
router.delete("/:id", authorizeRoles("admin"), deleteVehicle);

module.exports = router;
