const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Shipment Delay", "Maintenance", "Task", "Info"],
      default: "Info",
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    audienceRoles: [
      {
        type: String,
        enum: ["Admin", "Transport Manager", "Driver", "Warehouse Staff"],
      },
    ],
    isReadBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
