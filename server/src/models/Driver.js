const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, unique: true, trim: true },
    availabilityStatus: {
      type: String,
      enum: ["Available", "On Trip", "On Leave"],
      default: "Available",
    },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    completedTrips: { type: Number, default: 0 },
    onTimeRate: { type: Number, default: 92 },
    safetyScore: { type: Number, default: 95 },
    assignedTrips: [{ type: mongoose.Schema.Types.ObjectId, ref: "Shipment" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Driver", driverSchema);
