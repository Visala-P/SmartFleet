const mongoose = require("mongoose");
const config = require("./env");

const connectDB = async () => {
  if (!config.mongoUri) {
    throw new Error("MONGO_URI is missing. Add it in server/.env");
  }

  await mongoose.connect(config.mongoUri);
};

module.exports = connectDB;
