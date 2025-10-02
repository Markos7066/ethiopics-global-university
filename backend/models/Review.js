const mongoose = require("mongoose")

const reviewSchema = new mongoose.Schema(
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
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    isModerated: {
      type: Boolean,
      default: false,
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    moderationNote: {
      type: String,
    },
    teacherResponse: {
      type: String,
      maxlength: 500,
    },
    teacherResponseDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
reviewSchema.index({ teacher: 1, isVisible: 1 })
reviewSchema.index({ student: 1 })
reviewSchema.index({ booking: 1 })
reviewSchema.index({ rating: 1 })

// Ensure one review per booking
reviewSchema.index({ booking: 1 }, { unique: true })

// Virtual for average rating calculation
reviewSchema.virtual("teacherAverageRating", {
  ref: "Review",
  localField: "teacher",
  foreignField: "teacher",
  justOne: false,
})

// Pre-save middleware to validate booking completion
reviewSchema.pre("save", async function (next) {
  if (this.isNew) {
    const Booking = mongoose.model("Booking")
    const booking = await Booking.findById(this.booking)

    if (!booking) {
      return next(new Error("Booking not found"))
    }

    if (booking.status !== "completed") {
      return next(new Error("Can only review completed bookings"))
    }

    if (booking.student.toString() !== this.student.toString()) {
      return next(new Error("Only the student who made the booking can review"))
    }

    if (booking.teacher.toString() !== this.teacher.toString()) {
      return next(new Error("Teacher mismatch"))
    }
  }
  next()
})

module.exports = mongoose.model("Review", reviewSchema)
