const Driver = require("../models/Driver");
const asyncHandler = require("../utils/asyncHandler");
const { buildPagination, buildSort } = require("../utils/apiFeatures");

const listDrivers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query);
  const { search = "", availabilityStatus, sortBy, order } = req.query;

  const filter = {
    ...(search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { employeeId: { $regex: search, $options: "i" } },
            { licenseNumber: { $regex: search, $options: "i" } },
          ],
        }
      : {}),
    ...(availabilityStatus ? { availabilityStatus } : {}),
  };

  const [items, total] = await Promise.all([
    Driver.find(filter).sort(buildSort(sortBy, order)).skip(skip).limit(limit),
    Driver.countDocuments(filter),
  ]);

  return res.json({
    items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

const createDriver = asyncHandler(async (req, res) => {
  const item = await Driver.create(req.validated.body);
  return res.status(201).json(item);
});

const updateDriver = asyncHandler(async (req, res) => {
  const item = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ message: "Driver not found" });
  return res.json(item);
});

const deleteDriver = asyncHandler(async (req, res) => {
  const item = await Driver.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Driver not found" });
  return res.status(204).send();
});

const driverPerformance = asyncHandler(async (req, res) => {
  const top = await Driver.find().sort({ onTimeRate: -1, safetyScore: -1 }).limit(10);
  return res.json(top);
});

module.exports = { listDrivers, createDriver, updateDriver, deleteDriver, driverPerformance };
