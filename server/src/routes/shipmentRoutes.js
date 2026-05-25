const express = require("express");
const {
  listShipments,
  createShipment,
  updateShipment,
  deleteShipment,
  shipmentBoard,
  shipmentTimeline,
} = require("../controllers/shipmentController");
const { protect, authorizeRoles } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { shipmentSchema } = require("../validations/shipmentValidation");

const router = express.Router();

router.use(protect);
router.get("/", listShipments);
router.get("/board", shipmentBoard);
router.get("/:id/timeline", shipmentTimeline);
router.post("/", authorizeRoles("admin", "transport_manager", "warehouse_staff"), validate(shipmentSchema), createShipment);
router.put("/:id", authorizeRoles("admin", "transport_manager", "warehouse_staff"), updateShipment);
router.delete("/:id", authorizeRoles("admin", "transport_manager"), deleteShipment);

module.exports = router;
