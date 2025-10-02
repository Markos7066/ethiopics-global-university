const express = require("express")
const router = express.Router()
const { body } = require("express-validator")
const reviewController = require("../controllers/reviewController")
const auth = require("../middleware/auth")
const roleAuth = require("../middleware/roleAuth")

// Validation middleware
const reviewValidation = [
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("comment").isLength({ min: 10, max: 1000 }).withMessage("Comment must be between 10 and 1000 characters"),
]

const responseValidation = [
  body("response").isLength({ min: 1, max: 500 }).withMessage("Response must be between 1 and 500 characters"),
]

// Student routes
router.post(
  "/",
  auth,
  roleAuth(["student"]),
  [body("bookingId").isMongoId().withMessage("Valid booking ID required"), ...reviewValidation],
  reviewController.createReview,
)

router.get("/my-reviews", auth, roleAuth(["student"]), reviewController.getStudentReviews)

router.put("/:reviewId", auth, roleAuth(["student"]), reviewValidation, reviewController.updateReview)

router.delete("/:reviewId", auth, roleAuth(["student", "admin"]), reviewController.deleteReview)

// Teacher routes
router.get("/teacher/:teacherId", reviewController.getTeacherReviews)

router.get("/teacher/:teacherId/stats", reviewController.getReviewStats)

router.post("/:reviewId/response", auth, roleAuth(["teacher"]), responseValidation, reviewController.addTeacherResponse)

// Admin routes
router.get("/admin/all", auth, roleAuth(["admin"]), reviewController.getAllReviews)

router.put(
  "/admin/:reviewId/moderate",
  auth,
  roleAuth(["admin"]),
  [
    body("isVisible").isBoolean().withMessage("isVisible must be boolean"),
    body("moderationNote").optional().isLength({ max: 500 }).withMessage("Moderation note too long"),
  ],
  reviewController.moderateReview,
)

module.exports = router
