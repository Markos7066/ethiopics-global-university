const express = require("express")
const router = express.Router()
const {
  getDashboard,
  getTeachers,
  getTeacher,
  approveTeacher,
  rejectTeacher,
  updateTeacher,
  deleteTeacher,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  getComplaints,
  getComplaint,
  updateComplaintStatus,
  addComplaintResponse,
  deleteComplaint,
  getBookings,
  updateBookingStatus,
} = require("../controllers/adminController")

const { protect, authorize } = require("../middleware/auth")
const { body } = require("express-validator")

// Apply authentication and admin authorization to all routes
router.use(protect)
router.use(authorize("admin"))

// Dashboard
router.get("/dashboard", getDashboard)

// Teacher Management
router.route("/teachers").get(getTeachers)

router
  .route("/teachers/:id")
  .get(getTeacher)
  .put(
    [
      body("name").notEmpty().withMessage("Name is required"),
      body("email").isEmail().withMessage("Valid email is required"),
      body("hourlyRate").optional().isNumeric().withMessage("Hourly rate must be a number"),
    ],
    updateTeacher,
  )
  .delete(deleteTeacher)

router.put("/teachers/:id/approve", approveTeacher)
router.put(
  "/teachers/:id/reject",
  [body("reason").notEmpty().withMessage("Rejection reason is required")],
  rejectTeacher,
)

// Student Management
router.route("/students").get(getStudents)

router
  .route("/students/:id")
  .get(getStudent)
  .put(
    [
      body("name").notEmpty().withMessage("Name is required"),
      body("email").isEmail().withMessage("Valid email is required"),
    ],
    updateStudent,
  )
  .delete(deleteStudent)

// Complaint Management
router.route("/complaints").get(getComplaints)

router.route("/complaints/:id").get(getComplaint).delete(deleteComplaint)

router.put(
  "/complaints/:id/status",
  [body("status").isIn(["open", "in_progress", "resolved", "closed"]).withMessage("Invalid status")],
  updateComplaintStatus,
)

router.post(
  "/complaints/:id/response",
  [body("message").notEmpty().withMessage("Response message is required")],
  addComplaintResponse,
)

// Booking Management
router.route("/bookings").get(getBookings)

router.put(
  "/bookings/:id/status",
  [body("status").isIn(["pending", "confirmed", "cancelled", "completed"]).withMessage("Invalid status")],
  updateBookingStatus,
)

module.exports = router
