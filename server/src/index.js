const express = require("express");
const cors = require("cors");

const config = require("./config/env");
const connectDB = require("./config/db");
const routes = require("./routes");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");

const startServer = async () => {
  if (!config.jwtSecret) {
    throw new Error("JWT_SECRET is missing. Add it in server/.env");
  }

  await connectDB();

  // Create a local dev admin user if none exist (development only).
  if (config.nodeEnv !== "production") {
    try {
      const User = require("./models/User");
      const existing = await User.findOne({ role: "Admin" });
      if (!existing) {
        await User.create({ name: "Admin", email: "admin@smartfleet.com", password: "admin123", role: "Admin" });
        console.log("Created local dev admin: admin@smartfleet.com / admin123");
      }
    } catch (err) {
      console.warn("Dev user creation failed:", err.message || err);
    }
  }

  const app = express();

  app.use(
    cors({
      origin: config.corsOrigin.split(",").map((item) => item.trim()),
      credentials: true,
    })
  );
  app.use(express.json());
  app.get("/", (req, res) => {
  res.send("SmartFleet Backend Running Successfully");
});
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "smartfleet-api" });
  });

  app.use("/api", routes);
  app.use(notFound);
  app.use(errorHandler);

  app.listen(config.port, () => {
    console.log(`SmartFleet API running on port ${config.port}`);
  });
};

startServer().catch((error) => {
  console.error("Unable to start server", error);
  process.exit(1);
});
