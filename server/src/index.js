const express = require("express");
const cors = require("cors");

const config = require("./config/env");
const connectDB = require("./config/db");
const routes = require("./routes");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");
const User = require("./models/User");

const PERMANENT_USERS = [
  {
    name: "Admin",
    email: "admin@gmail.com",
    password: "admin",
    role: "admin",
  },
  {
    name: "Transport Manager",
    email: "transportmanager@gmail.com",
    password: "manager",
    role: "transport_manager",
  },
];

const LEGACY_ROLE_MAP = {
  Admin: "admin",
  "Transport Manager": "transport_manager",
  Driver: "driver",
  "Warehouse Staff": "warehouse_staff",
};

const normalizeLegacyUserRoles = async () => {
  const entries = Object.entries(LEGACY_ROLE_MAP);
  for (const [legacyRole, normalizedRole] of entries) {
    await User.updateMany({ role: legacyRole }, { $set: { role: normalizedRole } });
  }
};

const ensurePermanentUsers = async () => {
  for (const account of PERMANENT_USERS) {
    const existing = await User.findOne({ email: account.email });
    if (!existing) {
      await User.create(account);
      console.log(`Created permanent account: ${account.email}`);
      continue;
    }

    existing.name = account.name;
    existing.role = account.role;
    existing.isActive = true;
    existing.password = account.password;
    await existing.save();
  }
};

const startServer = async () => {
  if (!config.jwtSecret) {
    throw new Error("JWT_SECRET is missing. Add it in server/.env");
  }

  await connectDB();
  await normalizeLegacyUserRoles();
  await ensurePermanentUsers();

  const app = express();

  const app = express();

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);
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
