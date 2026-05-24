const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema(
  {
    shipmentId: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    origin: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
    status: {
      type: String,
      enum: ["Pending", "In Transit", "Delivered", "Delayed"],
      default: "Pending",
    },
    priority: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
    weight: { type: Number, default: 0 },
    scheduledPickup: { type: Date, required: true },
    estimatedDelivery: { type: Date, required: true },
    deliveredAt: { type: Date },
    timeline: [
      {
        label: String,
        timestamp: Date,
        note: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shipment", shipmentSchema);
