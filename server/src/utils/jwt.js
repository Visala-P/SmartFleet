const jwt = require("jsonwebtoken");
const config = require("../config/env");

const signToken = (payload) => jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

module.exports = { signToken };
