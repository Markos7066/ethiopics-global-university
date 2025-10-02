const Payment = require("../models/Payment")
const Booking = require("../models/Booking")
const User = require("../models/User")
const Notification = require("../models/Notification")
const { validationResult } = require("express-validator")
const emailService = require("../utils/emailService")
const notificationService = require("../utils/notificationService")

// @desc    Create payment intent
// @route   POST /api/payments/create-intent
// @access  Private/Student
exports.createPaymentIntent = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      })
    }

    const { booking, paymentMethod } = req.body

    // Verify booking exists and belongs to the student
    const bookingDoc = await Booking.findOne({
      _id: booking,
      student: req.user.id,
      status: "confirmed",
    }).populate("teacher", "name email")

    if (!bookingDoc) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or not confirmed",
      })
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ booking })
    if (existingPayment && existingPayment.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Payment already completed for this booking",
      })
    }

    // Create or update payment record
    let payment
    if (existingPayment) {
      payment = existingPayment
      payment.paymentMethod = paymentMethod
      payment.status = "pending"
    } else {
      payment = await Payment.create({
        student: req.user.id,
        teacher: bookingDoc.teacher._id,
        booking,
        amount: bookingDoc.price,
        paymentMethod,
        status: "pending",
      })
    }

    // Here you would integrate with your payment processor (Stripe, PayPal, etc.)
    // For now, we'll simulate the payment intent creation
    const paymentIntent = {
      id: `pi_${Date.now()}`,
      clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
      amount: bookingDoc.price * 100, // Convert to cents for Stripe
      currency: "usd",
    }

    payment.paymentIntentId = paymentIntent.id
    await payment.save()

    await payment.populate([
      { path: "student", select: "name email" },
      { path: "teacher", select: "name email" },
      { path: "booking", select: "date subject duration" },
    ])

    res.json({
      success: true,
      data: {
        payment,
        paymentIntent,
      },
    })
  } catch (error) {
    console.error("Create payment intent error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// @desc    Confirm payment
// @route   POST /api/payments/:id/confirm
// @access  Private/Student
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, transactionId } = req.body

    const payment = await Payment.findOne({
      _id: req.params.id,
      student: req.user.id,
    })
      .populate("student", "name email")
      .populate("teacher", "name email")
      .populate("booking", "date subject duration")

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      })
    }

    if (payment.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Payment already completed",
      })
    }

    // Here you would verify the payment with your payment processor
    // For now, we'll simulate successful payment verification
    const paymentVerified = true

    if (!paymentVerified) {
      payment.status = "failed"
      payment.failureReason = "Payment verification failed"
      await payment.save()

      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      })
    }

    // Update payment status
    payment.status = "completed"
    payment.paidAt = new Date()
    payment.transactionId = transactionId || paymentIntentId
    await payment.save()

    // Update booking payment reference
    await Booking.findByIdAndUpdate(payment.booking._id, {
      payment: payment._id,
      paymentStatus: "paid",
    })

    // Send notifications
    await Promise.all([
      // Notify teacher
      notificationService.createNotification({
        user: payment.teacher._id,
        title: "Payment Received",
        message: `Payment received for your lesson with ${payment.student.name}`,
        type: "payment_received",
        relatedId: payment._id,
      }),

      // Send confirmation emails
      emailService.sendPaymentConfirmationEmail(
        payment.student.email,
        payment.student.name,
        payment.amount,
        payment.booking.subject,
        payment.booking.date,
      ),

      emailService.sendPaymentNotificationEmail(
        payment.teacher.email,
        payment.teacher.name,
        payment.amount,
        payment.student.name,
        payment.booking.subject,
      ),
    ])

    res.json({
      success: true,
      data: payment,
      message: "Payment confirmed successfully",
    })
  } catch (error) {
    console.error("Confirm payment error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// @desc    Get user's payments
// @route   GET /api/payments
// @access  Private
exports.getPayments = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const status = req.query.status

    const query = {}

    // Filter by user role
    if (req.user.role === "student") {
      query.student = req.user.id
    } else if (req.user.role === "teacher") {
      query.teacher = req.user.id
    }

    if (status && status !== "all") {
      query.status = status
    }

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("student", "name email")
      .populate("teacher", "name email")
      .populate("booking", "date subject duration status")

    const total = await Payment.countDocuments(query)

    res.json({
      success: true,
      data: payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get payments error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
exports.getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("student", "name email phone")
      .populate("teacher", "name email phone")
      .populate("booking")

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      })
    }

    // Check if user has access to this payment
    if (
      req.user.role !== "admin" &&
      payment.student._id.toString() !== req.user.id &&
      payment.teacher._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    res.json({
      success: true,
      data: payment,
    })
  } catch (error) {
    console.error("Get payment error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// @desc    Request refund
// @route   POST /api/payments/:id/refund
// @access  Private/Student
exports.requestRefund = async (req, res) => {
  try {
    const { reason } = req.body

    const payment = await Payment.findOne({
      _id: req.params.id,
      student: req.user.id,
      status: "completed",
    })
      .populate("booking", "date status cancelledAt")
      .populate("teacher", "name email")

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found or not eligible for refund",
      })
    }

    if (payment.refundStatus && payment.refundStatus !== "failed") {
      return res.status(400).json({
        success: false,
        message: "Refund already requested or processed",
      })
    }

    // Check if booking was cancelled within refund policy
    const booking = payment.booking
    if (booking.status !== "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Refund only available for cancelled bookings",
      })
    }

    // Calculate refund amount based on cancellation time
    const now = new Date()
    const bookingDate = new Date(booking.date)
    const cancelledAt = new Date(booking.cancelledAt)
    const hoursBeforeBooking = (bookingDate.getTime() - cancelledAt.getTime()) / (1000 * 3600)

    let refundPercentage = 0
    if (hoursBeforeBooking >= 48) {
      refundPercentage = 100
    } else if (hoursBeforeBooking >= 24) {
      refundPercentage = 50
    } else {
      refundPercentage = 0
    }

    if (refundPercentage === 0) {
      return res.status(400).json({
        success: false,
        message: "No refund available for cancellations within 24 hours",
      })
    }

    const refundAmount = (payment.amount * refundPercentage) / 100

    // Update payment with refund request
    payment.refundStatus = "requested"
    payment.refundAmount = refundAmount
    payment.refundReason = reason
    payment.refundRequestedAt = new Date()
    await payment.save()

    // Notify admins about refund request
    const admins = await User.find({ role: "admin" })
    const adminNotifications = admins.map((admin) =>
      notificationService.createNotification({
        user: admin._id,
        title: "Refund Request",
        message: `${req.user.name} requested a refund of $${refundAmount}`,
        type: "refund_request",
        relatedId: payment._id,
      }),
    )

    await Promise.all([
      ...adminNotifications,
      // Send email to admins
      ...admins.map((admin) =>
        emailService.sendRefundRequestEmail(admin.email, admin.name, req.user.name, refundAmount, reason),
      ),
    ])

    res.json({
      success: true,
      data: payment,
      message: "Refund request submitted successfully",
    })
  } catch (error) {
    console.error("Request refund error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// @desc    Process refund (Admin only)
// @route   PUT /api/payments/:id/process-refund
// @access  Private/Admin
exports.processRefund = async (req, res) => {
  try {
    const { approved, adminNotes } = req.body

    const payment = await Payment.findOne({
      _id: req.params.id,
      refundStatus: "requested",
    })
      .populate("student", "name email")
      .populate("teacher", "name email")

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found or refund not requested",
      })
    }

    if (approved) {
      // Here you would process the actual refund with your payment processor
      // For now, we'll simulate successful refund processing

      payment.refundStatus = "completed"
      payment.refundProcessedAt = new Date()
      payment.refundProcessedBy = req.user.id
      payment.adminNotes = adminNotes

      // In a real implementation, you would also update the refund transaction ID
      payment.refundTransactionId = `rf_${Date.now()}`
    } else {
      payment.refundStatus = "rejected"
      payment.refundRejectedAt = new Date()
      payment.refundRejectedBy = req.user.id
      payment.adminNotes = adminNotes
    }

    await payment.save()

    // Send notification to student
    await Promise.all([
      notificationService.createNotification({
        user: payment.student._id,
        title: `Refund ${approved ? "Approved" : "Rejected"}`,
        message: approved
          ? `Your refund of $${payment.refundAmount} has been processed`
          : `Your refund request has been rejected. ${adminNotes}`,
        type: "refund_processed",
        relatedId: payment._id,
      }),

      // Send email notification
      approved
        ? emailService.sendRefundApprovalEmail(payment.student.email, payment.student.name, payment.refundAmount)
        : emailService.sendRefundRejectionEmail(payment.student.email, payment.student.name, adminNotes),
    ])

    res.json({
      success: true,
      data: payment,
      message: `Refund ${approved ? "approved" : "rejected"} successfully`,
    })
  } catch (error) {
    console.error("Process refund error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// @desc    Get payment statistics
// @route   GET /api/payments/stats
// @access  Private
exports.getPaymentStats = async (req, res) => {
  try {
    const query = {}

    if (req.user.role === "student") {
      query.student = req.user.id
    } else if (req.user.role === "teacher") {
      query.teacher = req.user.id
    }

    const stats = await Promise.all([
      Payment.countDocuments({ ...query, status: "pending" }),
      Payment.countDocuments({ ...query, status: "completed" }),
      Payment.countDocuments({ ...query, status: "failed" }),
      Payment.aggregate([
        { $match: { ...query, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Payment.aggregate([
        { $match: { ...query, refundStatus: "completed" } },
        { $group: { _id: null, total: { $sum: "$refundAmount" } } },
      ]),
    ])

    const [pending, completed, failed, totalEarnings, totalRefunds] = stats

    res.json({
      success: true,
      data: {
        pending,
        completed,
        failed,
        total: pending + completed + failed,
        totalEarnings: totalEarnings[0]?.total || 0,
        totalRefunds: totalRefunds[0]?.total || 0,
        netEarnings: (totalEarnings[0]?.total || 0) - (totalRefunds[0]?.total || 0),
      },
    })
  } catch (error) {
    console.error("Get payment stats error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}
