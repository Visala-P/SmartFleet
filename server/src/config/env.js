const dotenv = require("dotenv");

dotenv.config();

const parseOrigins = (value) =>
  (value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const defaultOrigins = ["http://localhost:5173"];

if (process.env.VERCEL_URL) {
  const vercelOrigin = process.env.VERCEL_URL.startsWith("http") ? process.env.VERCEL_URL : `https://${process.env.VERCEL_URL}`;
  defaultOrigins.push(vercelOrigin);
}

const configuredOrigins = parseOrigins(process.env.CORS_ORIGIN);

const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || "",
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigins: [
  "http://localhost:5173",
  "https://smart-fleet-gilt.vercel.app",
  ...(process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",")
    : []),
],
};

module.exports = config;
