const express = require("express")
const { body, validationResult, query } = require("express-validator")
const User = require("../models/User")
const Booking = require("../models/Booking")
const { auth, authorize } = require("../middleware/auth")
const emailTemplates = require("../utils/emailTemplates") // Import emailTemplates
//nst sendEmail = require("../utils/sendEmail") // Import sendEmail
const userController = require("../controllers/userController")

const router = express.Router()
 
router.get(
  "/teachers",
  userController.getTeachers,
)

// // @route   GET /api/users/teacher/:id
// // @desc    Get teacher profile by ID
// // @access  Public
// router.get("/teacher/:id", async (req, res) => {
//   try {
//     const teacher = await User.findOne({
//       _id: req.params.id,
//       role: "teacher",
//       isApproved: true,
//       isActive: true,
//     }).select("-password -cv")

//     if (!teacher) {
//       return res.status(404).json({ message: "Teacher not found" })
//     }

//     // Get teacher's completed bookings count and average rating (if you implement ratings)
//     const completedBookings = await Booking.countDocuments({
//       teacher: teacher._id,
//       status: "completed",
//     })

//     res.json({
//       ...teacher.toObject(),
//       stats: {
//         completedBookings,
//       },
//     })
//   } catch (error) {
//     console.error("Get teacher profile error:", error)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// // @route   GET /api/users/pending-teachers
// // @desc    Get all pending teacher approvals (Admin only)
// // @access  Private (Admin)
// router.get("/pending-teachers", auth, authorize("admin"), async (req, res) => {
//   try {
//     const pendingTeachers = await User.find({
//       role: "teacher",
//       isApproved: false,
//       isActive: true,
//     })
//       .select("-password")
//       .sort({ createdAt: -1 })

//     res.json(pendingTeachers)
//   } catch (error) {
//     console.error("Get pending teachers error:", error)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// // @route   PUT /api/users/approve-teacher/:id
// // @desc    Approve or reject teacher (Admin only)
// // @access  Private (Admin)
// router.put(
//   "/approve-teacher/:id",
//   auth,
//   authorize("admin"),
//   [
//     body("approved").isBoolean().withMessage("Approved status must be boolean"),
//     body("rejectionReason").optional().trim(),
//   ],
//   async (req, res) => {
//     try {
//       // Check for validation errors
//       const errors = validationResult(req)
//       if (!errors.isEmpty()) {
//         return res.status(400).json({ errors: errors.array() })
//       }

//       const { approved, rejectionReason } = req.body

//       const teacher = await User.findOne({
//         _id: req.params.id,
//         role: "teacher",
//       })

//       if (!teacher) {
//         return res.status(404).json({ message: "Teacher not found" })
//       }

//       if (approved) {
//         teacher.isApproved = true
//         teacher.approvedBy = req.user.id
//         teacher.approvedAt = new Date()

//         // Send approval email
//         const emailTemplate = emailTemplates.teacherApproval(teacher.name)
//         await sendEmail(teacher.email, emailTemplate.subject, emailTemplate.html)
//       } else {
//         teacher.isActive = false // Deactivate rejected teachers
//         // You might want to store rejection reason in a separate field
//       }

//       await teacher.save()

//       res.json({
//         message: approved ? "Teacher approved successfully" : "Teacher rejected",
//         teacher: {
//           id: teacher._id,
//           name: teacher.name,
//           email: teacher.email,
//           isApproved: teacher.isApproved,
//           isActive: teacher.isActive,
//         },
//       })
//     } catch (error) {
//       console.error("Approve teacher error:", error)
//       res.status(500).json({ message: "Server error" })
//     }
//   },
// )

// // @route   GET /api/users/students
// // @desc    Get all students (Admin only)
// // @access  Private (Admin)
// router.get(
//   "/students",
//   auth,
//   authorize("admin"),
//   [
//     query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
//     query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50"),
//   ],
//   async (req, res) => {
//     try {
//       // Check for validation errors
//       const errors = validationResult(req)
//       if (!errors.isEmpty()) {
//         return res.status(400).json({ errors: errors.array() })
//       }

//       const page = Number.parseInt(req.query.page) || 1
//       const limit = Number.parseInt(req.query.limit) || 10
//       const skip = (page - 1) * limit

//       const students = await User.find({
//         role: "student",
//         isActive: true,
//       })
//         .select("-password")
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limit)

//       const total = await User.countDocuments({
//         role: "student",
//         isActive: true,
//       })

//       res.json({
//         students,
//         pagination: {
//           current: page,
//           pages: Math.ceil(total / limit),
//           total,
//           hasNext: page < Math.ceil(total / limit),
//           hasPrev: page > 1,
//         },
//       })
//     } catch (error) {
//       console.error("Get students error:", error)
//       res.status(500).json({ message: "Server error" })
//     }
//   },
// )

// // @route   PUT /api/users/deactivate/:id
// // @desc    Deactivate user account (Admin only)
// // @access  Private (Admin)
// router.put("/deactivate/:id", auth, authorize("admin"), async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id)

//     if (!user) {
//       return res.status(404).json({ message: "User not found" })
//     }

//     user.isActive = false
//     await user.save()

//     res.json({
//       message: "User deactivated successfully",
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         isActive: user.isActive,
//       },
//     })
//   } catch (error) {
//     console.error("Deactivate user error:", error)
//     res.status(500).json({ message: "Server error" })
//   }
// })

module.exports = router
