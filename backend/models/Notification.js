const mongoose = require("mongoose")

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
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
      ],
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    // Related entities
    relatedBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    relatedPayment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    relatedComplaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
    },
    // Notification status
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    // Delivery channels
    channels: {
      inApp: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: false,
      },
      sms: {
        type: Boolean,
        default: false,
      },
      push: {
        type: Boolean,
        default: false,
      },
    },
    // Delivery status
    deliveryStatus: {
      inApp: {
        type: String,
        enum: ["pending", "delivered", "failed"],
        default: "pending",
      },
      email: {
        type: String,
        enum: ["pending", "sent", "delivered", "failed"],
        default: "pending",
      },
      sms: {
        type: String,
        enum: ["pending", "sent", "delivered", "failed"],
        default: "pending",
      },
      push: {
        type: String,
        enum: ["pending", "sent", "delivered", "failed"],
        default: "pending",
      },
    },
    // Action buttons for interactive notifications
    actions: [
      {
        label: String,
        action: String,
        url: String,
        style: {
          type: String,
          enum: ["primary", "secondary", "danger"],
          default: "primary",
        },
      },
    ],
    // Auto-delete after certain period
    expiresAt: Date,
    // Metadata
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 })
notificationSchema.index({ type: 1, createdAt: -1 })
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Mark as read method
notificationSchema.methods.markAsRead = function () {
  this.isRead = true
  this.readAt = new Date()
  return this.save()
}

module.exports = mongoose.model("Notification", notificationSchema)
