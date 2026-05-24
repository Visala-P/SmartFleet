const Shipment = require("../models/Shipment");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");

const getAnalytics = async (req, res) => {
  const [
    totalVehicles,
    activeDeliveries,
    delayedDeliveries,
    driversActive,
    monthlyTrips,
    shipmentStatuses,
    vehicleStatuses,
    topDrivers,
  ] = await Promise.all([
    Vehicle.countDocuments(),
    Shipment.countDocuments({ status: "In Transit" }),
    Shipment.countDocuments({ status: "Delayed" }),
    Driver.countDocuments({ availabilityStatus: "On Trip" }),
    Shipment.countDocuments({ createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }),
    Shipment.aggregate([{ $group: { _id: "$status", value: { $sum: 1 } } }]),
    Vehicle.aggregate([{ $group: { _id: "$status", value: { $sum: 1 } } }]),
    Driver.find().sort({ onTimeRate: -1 }).limit(6),
  ]);

  const monthlyDeliveries = await Shipment.aggregate([
    {
      $group: {
        _id: { $month: "$createdAt" },
        deliveries: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const fuelTrend = [
    { month: "Jan", liters: 7400 },
    { month: "Feb", liters: 6900 },
    { month: "Mar", liters: 7200 },
    { month: "Apr", liters: 7100 },
    { month: "May", liters: 7500 },
    { month: "Jun", liters: 6800 },
  ];

  return res.json({
    kpis: {
      totalVehicles,
      activeDeliveries,
      delayedDeliveries,
      fuelUsage: fuelTrend[fuelTrend.length - 1].liters,
      driversActive,
      monthlyTrips,
    },
    monthlyDeliveries,
    shipmentStatuses,
    vehicleStatuses,
    fuelTrend,
    topDrivers,
  });
};

module.exports = { getAnalytics };
