const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // in hours
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "expired"],
      default: "pending",
    },
    confirmedAt: Date,
    cancelledAt: Date,
    cancelReason: String,
    // Booking expires after one month
    expiresAt: {
      type: Date,
      default: () => {
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
    },
    notes: String,
    meetingLink: String, // For online classes
    location: String, // For in-person classes
    language: {
      type: String,
      required: true,
    },
    lessonType: {
      type: String,
      enum: ["individual", "group"],
      default: "individual",
    },
    // New fields for recurrence
    daysPerWeek: {
      type: Number,
      min: 1,
      max: 7,
      required: function () { return this.isRecurring; },
    },
    hoursPerDay: {
      type: Number,
      min: 1,
      required: function () { return this.isRecurring; },
    },
    specificDays: {
      type: [String],
      enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      required: function () { return this.isRecurring; },
    },
    
    isRecurring: {
      type: Boolean,
      default: false,
    },
    parentBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null, // For child bookings in a series
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
bookingSchema.index({ student: 1, teacher: 1, date: 1 });
bookingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Auto-expire bookings after one month
bookingSchema.pre("save", function (next) {
  if (this.isNew) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model("Booking", bookingSchema);