const Vehicle = require("../models/Vehicle");
const asyncHandler = require("../utils/asyncHandler");
const { buildPagination, buildSort } = require("../utils/apiFeatures");

const listVehicles = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query);
  const { search = "", status, sortBy, order } = req.query;

  const filter = {
    ...(search
      ? {
          $or: [
            { vehicleNumber: { $regex: search, $options: "i" } },
            { type: { $regex: search, $options: "i" } },
          ],
        }
      : {}),
    ...(status ? { status } : {}),
  };

  const [items, total] = await Promise.all([
    Vehicle.find(filter)
      .populate("driverAssigned", "name employeeId")
      .sort(buildSort(sortBy, order))
      .skip(skip)
      .limit(limit),
    Vehicle.countDocuments(filter),
  ]);

  return res.json({
    items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

const getVehicle = asyncHandler(async (req, res) => {
  const item = await Vehicle.findById(req.params.id).populate("driverAssigned", "name employeeId");
  if (!item) return res.status(404).json({ message: "Vehicle not found" });
  return res.json(item);
});

const createVehicle = asyncHandler(async (req, res) => {
  const payload = req.validated.body;
  const item = await Vehicle.create(payload);
  return res.status(201).json(item);
});

const updateVehicle = asyncHandler(async (req, res) => {
  const item = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ message: "Vehicle not found" });
  return res.json(item);
});

const deleteVehicle = asyncHandler(async (req, res) => {
  const item = await Vehicle.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Vehicle not found" });
  return res.status(204).send();
});

const maintenanceAlerts = asyncHandler(async (req, res) => {
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);

  const items = await Vehicle.find({
    $or: [
      { insuranceExpiryDate: { $lte: in30Days } },
      { nextServiceDate: { $lte: in30Days } },
    ],
  }).sort({ insuranceExpiryDate: 1 });

  return res.json(items);
});

module.exports = {
  listVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  maintenanceAlerts,
};
