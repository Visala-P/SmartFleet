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
router.post("/", authorizeRoles("Admin", "Transport Manager", "Warehouse Staff"), validate(shipmentSchema), createShipment);
router.put("/:id", authorizeRoles("Admin", "Transport Manager", "Warehouse Staff"), updateShipment);
router.delete("/:id", authorizeRoles("Admin", "Transport Manager"), deleteShipment);

module.exports = router;
