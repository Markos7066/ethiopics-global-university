const express = require("express")
const { body, validationResult, query } = require("express-validator")
const Payment = require("../models/Payment")
const Booking = require("../models/Booking")
const User = require("../models/User")
const Notification = require("../models/Notification")
const { auth, authorize } = require("../middleware/auth")
const { sendEmail, emailTemplates } = require("../utils/emailService")

const router = express.Router()

// @route   POST /api/payments
// @desc    Create a payment for a booking (Student only)
// @access  Private (Student)
router.post(
  "/",
  auth,
  authorize("student"),
  [
    body("bookingId").isMongoId().withMessage("Valid booking ID is required"),
    body("paymentMethod")
      .isIn(["credit_card", "debit_card", "paypal", "bank_transfer", "cash"])
      .withMessage("Invalid payment method"),
    body("paymentGateway")
      .optional()
      .isIn(["stripe", "paypal", "square", "manual"])
      .withMessage("Invalid payment gateway"),
    body("gatewayTransactionId").optional().trim(),
    body("discount").optional().isFloat({ min: 0 }).withMessage("Discount must be a positive number"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { bookingId, paymentMethod, paymentGateway, gatewayTransactionId, discount = 0 } = req.body

      // Find the booking
      const booking = await Booking.findOne({
        _id: bookingId,
        student: req.user.id,
        status: "confirmed",
      }).populate("teacher", "name email")

      if (!booking) {
        return res.status(404).json({ message: "Booking not found or not confirmed" })
      }

      // Check if payment already exists for this booking
      const existingPayment = await Payment.findOne({ booking: bookingId })
      if (existingPayment) {
        return res.status(400).json({ message: "Payment already exists for this booking" })
      }

      // Calculate payment amounts
      const subtotal = booking.price
      const discountAmount = discount
      const tax = subtotal * 0.1 // 10% tax (adjust as needed)
      const fees = paymentMethod === "credit_card" ? subtotal * 0.029 : 0 // 2.9% processing fee for credit cards
      const amount = subtotal - discountAmount + tax + fees

      // Create payment record
      const payment = new Payment({
        booking: bookingId,
        student: req.user.id,
        teacher: booking.teacher._id,
        amount,
        subtotal,
        tax,
        fees,
        discount: discountAmount,
        paymentMethod,
        paymentGateway,
        gatewayTransactionId,
        status: paymentMethod === "cash" ? "pending" : "completed", // Cash payments need manual verification
        paidAt: paymentMethod !== "cash" ? new Date() : null,
      })

      await payment.save()

      // Create notifications
      const studentNotification = new Notification({
        recipient: req.user.id,
        title: "Payment Processed",
        message: `Your payment of $${amount.toFixed(2)} for the ${booking.language} lesson has been processed`,
        type: "payment_received",
        relatedPayment: payment._id,
        relatedBooking: bookingId,
      })

      const teacherNotification = new Notification({
        recipient: booking.teacher._id,
        title: "Payment Received",
        message: `Payment of $${amount.toFixed(2)} received for your ${booking.language} lesson with ${req.user.name}`,
        type: "payment_received",
        relatedPayment: payment._id,
        relatedBooking: bookingId,
      })

      await Promise.all([studentNotification.save(), teacherNotification.save()])

      // Send email confirmations
      const emailTemplate = emailTemplates.paymentReceived(
        req.user.name,
        amount.toFixed(2),
        `${booking.language} lesson on ${booking.date.toDateString()}`,
      )

      await sendEmail(req.user.email, emailTemplate.subject, emailTemplate.html)

      // Populate payment details
      await payment.populate([
        { path: "booking", populate: { path: "teacher", select: "name email" } },
        { path: "student", select: "name email" },
      ])

      res.status(201).json({
        message: "Payment processed successfully",
        payment,
      })
    } catch (error) {
      console.error("Create payment error:", error)
      res.status(500).json({ message: "Server error during payment processing" })
    }
  },
)

// @route   GET /api/payments
// @desc    Get user's payments
// @access  Private
router.get(
  "/",
  auth,
  [
    query("status")
      .optional()
      .isIn(["pending", "completed", "failed", "refunded", "cancelled"])
      .withMessage("Invalid status"),
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
        // Admin can see all payments
      }

      if (req.query.status) {
        filter.status = req.query.status
      }

      const payments = await Payment.find(filter)
        .populate("student", "name email")
        .populate("teacher", "name email")
        .populate("booking", "date startTime endTime language")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)

      const total = await Payment.countDocuments(filter)

      res.json({
        payments,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      })
    } catch (error) {
      console.error("Get payments error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },
)

// @route   GET /api/payments/:id
// @desc    Get payment by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("student", "name email phone")
      .populate("teacher", "name email phone")
      .populate("booking", "date startTime endTime language duration")

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" })
    }

    // Check if user has permission to view this payment
    if (req.user.role === "student" && payment.student._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" })
    }
    if (req.user.role === "teacher" && payment.teacher._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" })
    }

    res.json(payment)
  } catch (error) {
    console.error("Get payment error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT /api/payments/:id/refund
// @desc    Process refund (Admin only)
// @access  Private (Admin)
router.put(
  "/:id/refund",
  auth,
  authorize("admin"),
  [
    body("refundAmount").isFloat({ min: 0 }).withMessage("Refund amount must be a positive number"),
    body("refundReason").notEmpty().withMessage("Refund reason is required"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { refundAmount, refundReason } = req.body

      const payment = await Payment.findById(req.params.id)
        .populate("student", "name email")
        .populate("teacher", "name email")
        .populate("booking", "date startTime endTime language")

      if (!payment) {
        return res.status(404).json({ message: "Payment not found" })
      }

      if (payment.status !== "completed") {
        return res.status(400).json({ message: "Can only refund completed payments" })
      }

      if (refundAmount > payment.amount) {
        return res.status(400).json({ message: "Refund amount cannot exceed payment amount" })
      }

      // Update payment
      payment.status = "refunded"
      payment.refundAmount = refundAmount
      payment.refundReason = refundReason
      payment.refundedAt = new Date()

      await payment.save()

      // Create notifications
      const studentNotification = new Notification({
        recipient: payment.student._id,
        sender: req.user.id,
        title: "Refund Processed",
        message: `A refund of $${refundAmount.toFixed(2)} has been processed for your ${payment.booking.language} lesson`,
        type: "payment_received",
        relatedPayment: payment._id,
      })

      const teacherNotification = new Notification({
        recipient: payment.teacher._id,
        sender: req.user.id,
        title: "Payment Refunded",
        message: `Payment of $${refundAmount.toFixed(2)} has been refunded for your ${payment.booking.language} lesson`,
        type: "payment_received",
        relatedPayment: payment._id,
      })

      await Promise.all([studentNotification.save(), teacherNotification.save()])

      // Send refund confirmation emails
      await Promise.all([
        sendEmail(
          payment.student.email,
          "Refund Processed - Language Teaching Center",
          `
          <h2>Refund Processed</h2>
          <p>Dear ${payment.student.name},</p>
          <p>A refund of $${refundAmount.toFixed(2)} has been processed for your ${payment.booking.language} lesson.</p>
          <p><strong>Reason:</strong> ${refundReason}</p>
          <p>The refund will appear in your account within 3-5 business days.</p>
        `,
        ),
        sendEmail(
          payment.teacher.email,
          "Payment Refunded - Language Teaching Center",
          `
          <h2>Payment Refunded</h2>
          <p>Dear ${payment.teacher.name},</p>
          <p>A payment of $${refundAmount.toFixed(2)} has been refunded for your ${payment.booking.language} lesson.</p>
          <p><strong>Reason:</strong> ${refundReason}</p>
        `,
        ),
      ])

      res.json({
        message: "Refund processed successfully",
        payment,
      })
    } catch (error) {
      console.error("Process refund error:", error)
      res.status(500).json({ message: "Server error during refund processing" })
    }
  },
)

// @route   PUT /api/payments/:id/verify
// @desc    Verify cash payment (Admin only)
// @access  Private (Admin)
router.put("/:id/verify", auth, authorize("admin"), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("student", "name email")
      .populate("teacher", "name email")

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" })
    }

    if (payment.status !== "pending") {
      return res.status(400).json({ message: "Payment is not pending verification" })
    }

    // Update payment
    payment.status = "completed"
    payment.paidAt = new Date()

    await payment.save()

    // Create notifications
    const studentNotification = new Notification({
      recipient: payment.student._id,
      sender: req.user.id,
      title: "Payment Verified",
      message: `Your cash payment of $${payment.amount.toFixed(2)} has been verified`,
      type: "payment_received",
      relatedPayment: payment._id,
    })

    const teacherNotification = new Notification({
      recipient: payment.teacher._id,
      sender: req.user.id,
      title: "Payment Verified",
      message: `Cash payment of $${payment.amount.toFixed(2)} has been verified for your lesson`,
      type: "payment_received",
      relatedPayment: payment._id,
    })

    await Promise.all([studentNotification.save(), teacherNotification.save()])

    res.json({
      message: "Payment verified successfully",
      payment,
    })
  } catch (error) {
    console.error("Verify payment error:", error)
    res.status(500).json({ message: "Server error during payment verification" })
  }
})

// @route   GET /api/payments/stats/summary
// @desc    Get payment statistics (Admin only)
// @access  Private (Admin)
router.get("/stats/summary", auth, authorize("admin"), async (req, res) => {
  try {
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ])

    const totalPayments = await Payment.countDocuments()
    const totalRevenue = await Payment.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])

    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])

    res.json({
      stats,
      totalPayments,
      totalRevenue: totalRevenue[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
    })
  } catch (error) {
    console.error("Get payment stats error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
