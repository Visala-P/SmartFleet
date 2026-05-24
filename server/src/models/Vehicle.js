const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: { type: String, required: true, unique: true, trim: true },
    type: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    driverAssigned: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
    status: {
      type: String,
      enum: ["Available", "In Transit", "Maintenance", "Inactive"],
      default: "Available",
    },
    fuelType: { type: String, default: "Diesel" },
    fuelConsumptionKmPerL: { type: Number, default: 6.5 },
    insuranceExpiryDate: { type: Date, required: true },
    lastServiceDate: { type: Date, required: true },
    nextServiceDate: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
