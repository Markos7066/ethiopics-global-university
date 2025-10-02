const express = require("express")
const { body, validationResult, query } = require("express-validator")
const Notification = require("../models/Notification")
const User = require("../models/User")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// @route   GET /api/notifications
// @desc    Get user's notifications
// @access  Private
router.get(
  "/",
  auth,
  [
    query("isRead").optional().isBoolean().withMessage("isRead must be boolean"),
    query("type")
      .optional()
      .isIn([
        "booking_request",
        "booking_confirmed",
        "booking_cancelled",
        "payment_received",
        "payment_failed",
        "teacher_approved",
        "teacher_rejected",
        "complaint_filed",
        "complaint_resolved",
        "reminder",
        "system",
        "general",
      ])
      .withMessage("Invalid notification type"),
    query("priority").optional().isIn(["low", "normal", "high", "urgent"]).withMessage("Invalid priority"),
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
      const limit = Number.parseInt(req.query.limit) || 20
      const skip = (page - 1) * limit

      // Build filter
      const filter = { recipient: req.user.id }

      if (req.query.isRead !== undefined) {
        filter.isRead = req.query.isRead === "true"
      }
      if (req.query.type) filter.type = req.query.type
      if (req.query.priority) filter.priority = req.query.priority

      const notifications = await Notification.find(filter)
        .populate("sender", "name email role")
        .populate("relatedBooking", "date startTime endTime language")
        .populate("relatedPayment", "amount status")
        .populate("relatedComplaint", "title status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)

      const total = await Notification.countDocuments(filter)
      const unreadCount = await Notification.countDocuments({
        recipient: req.user.id,
        isRead: false,
      })

      res.json({
        notifications,
        unreadCount,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      })
    } catch (error) {
      console.error("Get notifications error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },
)

// @route   GET /api/notifications/unread-count
// @desc    Get count of unread notifications
// @access  Private
router.get("/unread-count", auth, async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false,
    })

    res.json({ unreadCount })
  } catch (error) {
    console.error("Get unread count error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put("/:id/read", auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id,
    })

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" })
    }

    if (!notification.isRead) {
      await notification.markAsRead()
    }

    res.json({
      message: "Notification marked as read",
      notification,
    })
  } catch (error) {
    console.error("Mark notification as read error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.put("/mark-all-read", auth, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        recipient: req.user.id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
    )

    res.json({
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    })
  } catch (error) {
    console.error("Mark all notifications as read error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user.id,
    })

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" })
    }

    res.json({ message: "Notification deleted successfully" })
  } catch (error) {
    console.error("Delete notification error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   POST /api/notifications/send
// @desc    Send notification to user(s) (Admin only)
// @access  Private (Admin)
router.post(
  "/send",
  auth,
  authorize("admin"),
  [
    body("recipients").isArray({ min: 1 }).withMessage("At least one recipient is required"),
    body("recipients.*").isMongoId().withMessage("Valid user IDs are required"),
    body("title")
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Title is required and must be under 200 characters"),
    body("message").trim().isLength({ min: 1 }).withMessage("Message is required"),
    body("type")
      .isIn([
        "booking_request",
        "booking_confirmed",
        "booking_cancelled",
        "payment_received",
        "payment_failed",
        "teacher_approved",
        "teacher_rejected",
        "complaint_filed",
        "complaint_resolved",
        "reminder",
        "system",
        "general",
      ])
      .withMessage("Invalid notification type"),
    body("priority").optional().isIn(["low", "normal", "high", "urgent"]).withMessage("Invalid priority"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { recipients, title, message, type, priority = "normal" } = req.body

      // Verify all recipients exist
      const users = await User.find({
        _id: { $in: recipients },
        isActive: true,
      })

      if (users.length !== recipients.length) {
        return res.status(400).json({ message: "Some recipients not found or inactive" })
      }

      // Create notifications for all recipients
      const notifications = recipients.map((recipientId) => ({
        recipient: recipientId,
        sender: req.user.id,
        title,
        message,
        type,
        priority,
      }))

      const createdNotifications = await Notification.insertMany(notifications)

      res.status(201).json({
        message: "Notifications sent successfully",
        count: createdNotifications.length,
        notifications: createdNotifications,
      })
    } catch (error) {
      console.error("Send notification error:", error)
      res.status(500).json({ message: "Server error during notification sending" })
    }
  },
)

// @route   POST /api/notifications/broadcast
// @desc    Broadcast notification to all users of specific role(s) (Admin only)
// @access  Private (Admin)
router.post(
  "/broadcast",
  auth,
  authorize("admin"),
  [
    body("roles").isArray({ min: 1 }).withMessage("At least one role is required"),
    body("roles.*").isIn(["student", "teacher", "admin"]).withMessage("Invalid role"),
    body("title")
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Title is required and must be under 200 characters"),
    body("message").trim().isLength({ min: 1 }).withMessage("Message is required"),
    body("type")
      .isIn([
        "booking_request",
        "booking_confirmed",
        "booking_cancelled",
        "payment_received",
        "payment_failed",
        "teacher_approved",
        "teacher_rejected",
        "complaint_filed",
        "complaint_resolved",
        "reminder",
        "system",
        "general",
      ])
      .withMessage("Invalid notification type"),
    body("priority").optional().isIn(["low", "normal", "high", "urgent"]).withMessage("Invalid priority"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { roles, title, message, type, priority = "normal" } = req.body

      // Get all users with specified roles
      const users = await User.find({
        role: { $in: roles },
        isActive: true,
      }).select("_id")

      if (users.length === 0) {
        return res.status(400).json({ message: "No active users found with specified roles" })
      }

      // Create notifications for all users
      const notifications = users.map((user) => ({
        recipient: user._id,
        sender: req.user.id,
        title,
        message,
        type,
        priority,
      }))

      const createdNotifications = await Notification.insertMany(notifications)

      res.status(201).json({
        message: "Broadcast notification sent successfully",
        count: createdNotifications.length,
        roles,
      })
    } catch (error) {
      console.error("Broadcast notification error:", error)
      res.status(500).json({ message: "Server error during broadcast" })
    }
  },
)

// @route   GET /api/notifications/stats
// @desc    Get notification statistics (Admin only)
// @access  Private (Admin)
router.get("/stats", auth, authorize("admin"), async (req, res) => {
  try {
    const stats = await Notification.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          unreadCount: {
            $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] },
          },
        },
      },
    ])

    const priorityStats = await Notification.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ])

    const totalNotifications = await Notification.countDocuments()
    const totalUnread = await Notification.countDocuments({ isRead: false })

    res.json({
      totalNotifications,
      totalUnread,
      typeStats: stats,
      priorityStats,
    })
  } catch (error) {
    console.error("Get notification stats error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
