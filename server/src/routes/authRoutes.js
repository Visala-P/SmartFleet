const express = require("express");
const { signup, login, me, logout } = require("../controllers/authController");
const { protect } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { signupSchema, loginSchema } = require("../validations/authValidation");

const router = express.Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.get("/me", protect, me);
router.post("/logout", protect, logout);

module.exports = router;
