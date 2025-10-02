const express = require("express")
const { body, validationResult, query } = require("express-validator")
const multer = require("multer")
const path = require("path")
const Complaint = require("../models/Complaint")
const Booking = require("../models/Booking")
const User = require("../models/User")
const Notification = require("../models/Notification")
const { auth, authorize } = require("../middleware/auth")
const { sendEmail } = require("../utils/emailService")

const router = express.Router()

// Configure multer for file uploads (complaint attachments)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/complaints/")
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|txt/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error("Only images, PDFs, and documents are allowed"))
    }
  },
})

// @route   POST /api/complaints
// @desc    File a complaint about a specific booking (Student only)
// @access  Private (Student)
router.post(
  "/",
  auth,
  authorize("student"),
  upload.array("attachments", 5), // Allow up to 5 attachments
  [
    body("bookingId").isMongoId().withMessage("Valid booking ID is required"),
    body("title").trim().isLength({ min: 5, max: 200 }).withMessage("Title must be between 5 and 200 characters"),
    body("description").trim().isLength({ min: 20 }).withMessage("Description must be at least 20 characters"),
    body("category")
      .isIn(["quality", "punctuality", "behavior", "technical", "payment", "other"])
      .withMessage("Invalid category"),
    body("severity").optional().isIn(["low", "medium", "high", "critical"]).withMessage("Invalid severity"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { bookingId, title, description, category, severity = "medium" } = req.body

      // Verify booking exists and belongs to the student
      const booking = await Booking.findOne({
        _id: bookingId,
        student: req.user.id,
        status: { $in: ["completed", "cancelled"] }, // Can only complain about completed or cancelled bookings
      }).populate("teacher", "name email")

      if (!booking) {
        return res.status(404).json({ message: "Booking not found or complaint cannot be filed for this booking" })
      }

      // Check if complaint already exists for this booking
      const existingComplaint = await Complaint.findOne({
        booking: bookingId,
        student: req.user.id,
      })

      if (existingComplaint) {
        return res.status(400).json({ message: "Complaint already exists for this booking" })
      }

      // Process attachments
      const attachments = req.files
        ? req.files.map((file) => ({
            filename: file.originalname,
            url: file.path,
          }))
        : []

      // Create complaint
      const complaint = new Complaint({
        student: req.user.id,
        teacher: booking.teacher._id,
        booking: bookingId,
        title,
        description,
        category,
        severity,
        attachments,
      })

      await complaint.save()

      // Populate complaint details
      await complaint.populate([
        { path: "student", select: "name email" },
        { path: "teacher", select: "name email" },
        { path: "booking", select: "date startTime endTime language" },
      ])

      // Create notifications for admin users
      const admins = await User.find({ role: "admin", isActive: true })

      const adminNotifications = admins.map((admin) => ({
        recipient: admin._id,
        sender: req.user.id,
        title: "New Complaint Filed",
        message: `${req.user.name} filed a complaint about ${booking.teacher.name} regarding a ${booking.language} lesson`,
        type: "complaint_filed",
        relatedComplaint: complaint._id,
        priority: severity === "critical" ? "urgent" : severity === "high" ? "high" : "normal",
      }))

      await Notification.insertMany(adminNotifications)

      // Send email notifications to admins
      const adminEmails = admins.map((admin) => admin.email)
      if (adminEmails.length > 0) {
        await sendEmail(
          adminEmails.join(","),
          "New Complaint Filed - Language Teaching Center",
          `
          <h2>New Complaint Filed</h2>
          <p>A new complaint has been filed by ${req.user.name}.</p>
          <p><strong>Details:</strong></p>
          <ul>
            <li>Teacher: ${booking.teacher.name}</li>
            <li>Category: ${category}</li>
            <li>Severity: ${severity}</li>
            <li>Booking Date: ${booking.date.toDateString()}</li>
          </ul>
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Description:</strong> ${description}</p>
          <p>Please log in to the admin dashboard to review and handle this complaint.</p>
        `,
        )
      }

      res.status(201).json({
        message: "Complaint filed successfully",
        complaint,
      })
    } catch (error) {
      console.error("File complaint error:", error)
      res.status(500).json({ message: "Server error during complaint filing" })
    }
  },
)

// @route   GET /api/complaints
// @desc    Get complaints (filtered by user role)
// @access  Private
router.get(
  "/",
  auth,
  [
    query("status")
      .optional()
      .isIn(["open", "in_progress", "resolved", "closed", "dismissed"])
      .withMessage("Invalid status"),
    query("category")
      .optional()
      .isIn(["quality", "punctuality", "behavior", "technical", "payment", "other"])
      .withMessage("Invalid category"),
    query("severity").optional().isIn(["low", "medium", "high", "critical"]).withMessage("Invalid severity"),
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const page = Number.parseInt(req.query.page) || 1
      const limit = Number.parseInt(req.query.limit) || 10
      const skip = (page - 1) * limit

      // Build filter based on user role
      const filter = {}
      if (req.user.role === "student") {
        filter.student = req.user.id
      } else if (req.user.role === "teacher") {
        filter.teacher = req.user.id
      } else if (req.user.role === "admin") {
        // Admin can see all complaints
      }

      // Add query filters
      if (req.query.status) filter.status = req.query.status
      if (req.query.category) filter.category = req.query.category
      if (req.query.severity) filter.severity = req.query.severity

      const complaints = await Complaint.find(filter)
        .populate("student", "name email")
        .populate("teacher", "name email")
        .populate("booking", "date startTime endTime language")
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)

      const total = await Complaint.countDocuments(filter)

      res.json({
        complaints,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      })
    } catch (error) {
      console.error("Get complaints error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },
)

// @route   GET /api/complaints/:id
// @desc    Get complaint by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("student", "name email phone")
      .populate("teacher", "name email phone")
      .populate("booking", "date startTime endTime language duration price")
      .populate("assignedTo", "name email")
      .populate("resolvedBy", "name email")
      .populate("messages.sender", "name email role")

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" })
    }

    // Check if user has permission to view this complaint
    if (req.user.role === "student" && complaint.student._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" })
    }
    if (req.user.role === "teacher" && complaint.teacher._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" })
    }

    res.json(complaint)
  } catch (error) {
    console.error("Get complaint error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT /api/complaints/:id/assign
// @desc    Assign complaint to admin (Admin only)
// @access  Private (Admin)
router.put(
  "/:id/assign",
  auth,
  authorize("admin"),
  [body("adminId").optional().isMongoId().withMessage("Valid admin ID is required")],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { adminId } = req.body
      const assignTo = adminId || req.user.id // Assign to specified admin or self

      // Verify admin exists
      const admin = await User.findOne({ _id: assignTo, role: "admin", isActive: true })
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" })
      }

      const complaint = await Complaint.findById(req.params.id)
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" })
      }

      // Update complaint
      complaint.assignedTo = assignTo
      complaint.status = "in_progress"
      await complaint.save()

      // Add message to complaint thread
      complaint.messages.push({
        sender: req.user.id,
        message: `Complaint assigned to ${admin.name}`,
        isInternal: true,
      })

      await complaint.save()

      // Create notification for assigned admin (if different from current user)
      if (assignTo !== req.user.id) {
        const notification = new Notification({
          recipient: assignTo,
          sender: req.user.id,
          title: "Complaint Assigned",
          message: `You have been assigned a ${complaint.severity} priority complaint`,
          type: "complaint_filed",
          relatedComplaint: complaint._id,
          priority: complaint.severity === "critical" ? "urgent" : "normal",
        })

        await notification.save()
      }

      await complaint.populate("assignedTo", "name email")

      res.json({
        message: "Complaint assigned successfully",
        complaint,
      })
    } catch (error) {
      console.error("Assign complaint error:", error)
      res.status(500).json({ message: "Server error during complaint assignment" })
    }
  },
)

// @route   POST /api/complaints/:id/messages
// @desc    Add message to complaint thread
// @access  Private
router.post(
  "/:id/messages",
  auth,
  [body("message").trim().isLength({ min: 1 }).withMessage("Message cannot be empty")],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { message } = req.body

      const complaint = await Complaint.findById(req.params.id)
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" })
      }

      // Check if user has permission to add messages
      const canAddMessage =
        req.user.role === "admin" ||
        complaint.student.toString() === req.user.id ||
        complaint.teacher.toString() === req.user.id

      if (!canAddMessage) {
        return res.status(403).json({ message: "Access denied" })
      }

      // Add message
      complaint.messages.push({
        sender: req.user.id,
        message,
        isInternal: req.user.role === "admin" && req.body.isInternal === true,
      })

      await complaint.save()

      // Populate the new message
      await complaint.populate("messages.sender", "name email role")

      // Create notifications for relevant parties (except sender)
      const recipients = []
      if (req.user.id !== complaint.student.toString()) recipients.push(complaint.student)
      if (req.user.id !== complaint.teacher.toString()) recipients.push(complaint.teacher)
      if (complaint.assignedTo && req.user.id !== complaint.assignedTo.toString()) {
        recipients.push(complaint.assignedTo)
      }

      const notifications = recipients.map((recipientId) => ({
        recipient: recipientId,
        sender: req.user.id,
        title: "New Message in Complaint",
        message: `New message added to complaint: ${complaint.title}`,
        type: "complaint_filed",
        relatedComplaint: complaint._id,
      }))

      if (notifications.length > 0) {
        await Notification.insertMany(notifications)
      }

      res.json({
        message: "Message added successfully",
        newMessage: complaint.messages[complaint.messages.length - 1],
      })
    } catch (error) {
      console.error("Add message error:", error)
      res.status(500).json({ message: "Server error during message addition" })
    }
  },
)

// @route   PUT /api/complaints/:id/resolve
// @desc    Resolve complaint (Admin only)
// @access  Private (Admin)
router.put(
  "/:id/resolve",
  auth,
  authorize("admin"),
  [body("resolution").trim().isLength({ min: 10 }).withMessage("Resolution must be at least 10 characters")],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { resolution } = req.body

      const complaint = await Complaint.findById(req.params.id)
        .populate("student", "name email")
        .populate("teacher", "name email")

      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" })
      }

      // Update complaint
      complaint.status = "resolved"
      complaint.resolution = resolution
      complaint.resolvedAt = new Date()
      complaint.resolvedBy = req.user.id

      // Add resolution message
      complaint.messages.push({
        sender: req.user.id,
        message: `Complaint resolved: ${resolution}`,
        isInternal: false,
      })

      await complaint.save()

      // Create notifications
      const studentNotification = new Notification({
        recipient: complaint.student._id,
        sender: req.user.id,
        title: "Complaint Resolved",
        message: `Your complaint "${complaint.title}" has been resolved`,
        type: "complaint_resolved",
        relatedComplaint: complaint._id,
      })

      const teacherNotification = new Notification({
        recipient: complaint.teacher._id,
        sender: req.user.id,
        title: "Complaint Resolved",
        message: `The complaint regarding your lesson has been resolved`,
        type: "complaint_resolved",
        relatedComplaint: complaint._id,
      })

      await Promise.all([studentNotification.save(), teacherNotification.save()])

      // Send resolution emails
      await Promise.all([
        sendEmail(
          complaint.student.email,
          "Complaint Resolved - Language Teaching Center",
          `
          <h2>Complaint Resolved</h2>
          <p>Dear ${complaint.student.name},</p>
          <p>Your complaint "${complaint.title}" has been resolved.</p>
          <p><strong>Resolution:</strong></p>
          <p>${resolution}</p>
          <p>If you have any further questions, please contact our support team.</p>
        `,
        ),
        sendEmail(
          complaint.teacher.email,
          "Complaint Resolved - Language Teaching Center",
          `
          <h2>Complaint Resolved</h2>
          <p>Dear ${complaint.teacher.name},</p>
          <p>The complaint regarding your lesson has been resolved.</p>
          <p><strong>Resolution:</strong></p>
          <p>${resolution}</p>
        `,
        ),
      ])

      await complaint.populate("resolvedBy", "name email")

      res.json({
        message: "Complaint resolved successfully",
        complaint,
      })
    } catch (error) {
      console.error("Resolve complaint error:", error)
      res.status(500).json({ message: "Server error during complaint resolution" })
    }
  },
)

// @route   GET /api/complaints/stats/summary
// @desc    Get complaint statistics (Admin only)
// @access  Private (Admin)
router.get("/stats/summary", auth, authorize("admin"), async (req, res) => {
  try {
    const stats = await Complaint.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ])

    const categoryStats = await Complaint.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ])

    const severityStats = await Complaint.aggregate([
      {
        $group: {
          _id: "$severity",
          count: { $sum: 1 },
        },
      },
    ])

    const totalComplaints = await Complaint.countDocuments()
    const openComplaints = await Complaint.countDocuments({ status: "open" })
    const resolvedComplaints = await Complaint.countDocuments({ status: "resolved" })

    res.json({
      totalComplaints,
      openComplaints,
      resolvedComplaints,
      statusStats: stats,
      categoryStats,
      severityStats,
    })
  } catch (error) {
    console.error("Get complaint stats error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
