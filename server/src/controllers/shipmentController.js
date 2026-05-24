const Shipment = require("../models/Shipment");
const Driver = require("../models/Driver");
const asyncHandler = require("../utils/asyncHandler");
const { buildPagination, buildSort } = require("../utils/apiFeatures");

const listShipments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query);
  const { search = "", status, priority, sortBy, order } = req.query;

  const filter = {
    ...(search
      ? {
          $or: [
            { shipmentId: { $regex: search, $options: "i" } },
            { title: { $regex: search, $options: "i" } },
            { origin: { $regex: search, $options: "i" } },
            { destination: { $regex: search, $options: "i" } },
          ],
        }
      : {}),
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
  };

  const [items, total] = await Promise.all([
    Shipment.find(filter)
      .populate("vehicle", "vehicleNumber type")
      .populate("driver", "name employeeId")
      .sort(buildSort(sortBy, order))
      .skip(skip)
      .limit(limit),
    Shipment.countDocuments(filter),
  ]);

  return res.json({ items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } });
});

const createShipment = asyncHandler(async (req, res) => {
  const payload = req.validated.body;

  const shipment = await Shipment.create({
    ...payload,
    timeline: [{ label: "Shipment Created", timestamp: new Date(), note: "Created by control tower" }],
  });

  if (shipment.driver) {
    await Driver.findByIdAndUpdate(shipment.driver, { $addToSet: { assignedTrips: shipment._id } });
  }

  return res.status(201).json(shipment);
});

const updateShipment = asyncHandler(async (req, res) => {
  const item = await Shipment.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Shipment not found" });

  const oldStatus = item.status;
  Object.assign(item, req.body);

  if (req.body.status && req.body.status !== oldStatus) {
    item.timeline.push({
      label: `Status changed to ${req.body.status}`,
      timestamp: new Date(),
      note: req.body.statusNote || "Auto-tracked by TMS",
    });
  }

  if (req.body.status === "Delivered" && !item.deliveredAt) {
    item.deliveredAt = new Date();
  }

  await item.save();
  return res.json(item);
});

const deleteShipment = asyncHandler(async (req, res) => {
  const item = await Shipment.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Shipment not found" });
  return res.status(204).send();
});

const shipmentBoard = asyncHandler(async (req, res) => {
  const statuses = ["Pending", "In Transit", "Delivered", "Delayed"];
  const board = await Promise.all(
    statuses.map(async (status) => ({
      status,
      items: await Shipment.find({ status })
        .populate("vehicle", "vehicleNumber")
        .populate("driver", "name")
        .sort({ updatedAt: -1 }),
    }))
  );

  return res.json(board);
});

const shipmentTimeline = asyncHandler(async (req, res) => {
  const item = await Shipment.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Shipment not found" });

  return res.json({ shipmentId: item.shipmentId, timeline: item.timeline });
});

module.exports = {
  listShipments,
  createShipment,
  updateShipment,
  deleteShipment,
  shipmentBoard,
  shipmentTimeline,
};
