const express = require("express")
const { body, validationResult } = require("express-validator")
const authController = require("../controllers/authController")
const { auth } = require("../middleware/auth")
const upload = require("../middleware/upload")

const router = express.Router()
 
router.post(
  "/register",
  upload.teacherRegistration,
 
  authController.register,
)
 
router.post(
  "/login",
  authController.login,
)
 
router.get("/me", auth, authController.getMe)
 
router.put(
  "/profile",
  auth,
  
  authController.updateProfile,
)
 
router.put(
  "/password",
  auth,
  
  authController.changePassword,
)
 
router.post(
  "/forgot-password",
  [body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email")],
  authController.forgotPassword,
)

// @route   PUT /api/auth/reset-password/:token
// @desc    Reset password with token
// @access  Public
router.put(
  "/reset-password/:token",
  [body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters")],
  authController.resetPassword,
)

module.exports = router
