const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { signToken } = require("../utils/jwt");

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
});

const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.validated.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: "Email already exists" });
  }

  const user = await User.create({ name, email, password, role });

  return res.status(201).json({
    message: "Account created successfully",
    user: sanitizeUser(user),
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return res.status(401).json({ message: "Signup to login" });
  }

  const ok = await user.comparePassword(password);
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken({ userId: user._id, role: user.role });

  res.cookie("smartfleet_token", token, COOKIE_OPTIONS);

  return res.json({ user: sanitizeUser(user) });
});

const me = asyncHandler(async (req, res) => {
  return res.json({ user: sanitizeUser(req.user) });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie("smartfleet_token", COOKIE_OPTIONS);
  return res.json({ message: "Logged out successfully" });
});

module.exports = { signup, login, me, logout };
