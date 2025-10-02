const Review = require("../models/Review")
const TeacherProfile = require("../models/TeacherProfile")
const Booking = require("../models/Booking")
const User = require("../models/User")
const { validationResult } = require("express-validator")
const mongoose = require("mongoose") // Import mongoose

// Create a new review
exports.createReview = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      })
    }

    const { bookingId, rating, comment } = req.body
    const studentId = req.user.id

    // Check if booking exists and is completed
    const booking = await Booking.findById(bookingId)
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      })
    }

    if (booking.student.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: "You can only review your own bookings",
      })
    }

    if (booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Can only review completed bookings",
      })
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ booking: bookingId })
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "Review already exists for this booking",
      })
    }

    const review = new Review({
      student: studentId,
      teacher: booking.teacher,
      booking: bookingId,
      rating,
      comment,
    })

    await review.save()
    await review.populate(["student", "teacher", "booking"])

    await updateTeacherStats(booking.teacher)

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: review,
    })
  } catch (error) {
    console.error("Create review error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

const updateTeacherStats = async (teacherId) => {
  const reviews = await Review.find({ teacher: teacherId, isVisible: true })
  const totalReviews = reviews.length
  const totalRating = totalReviews > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0

  const totalStudents = await Booking.distinct("student", { teacher: teacherId, status: "completed" })

  await TeacherProfile.findOneAndUpdate(
    { user: teacherId },
    {
      totalReview: totalReviews,
      totalRating: totalRating,
      totalStudent: totalStudents.length,
    },
  )
}

// Get reviews for a teacher
exports.getTeacherReviews = async (req, res) => {
  try {
    const { teacherId } = req.params
    const { page = 1, limit = 10, rating } = req.query

    const query = {
      teacher: teacherId,
      isVisible: true,
    }

    if (rating) {
      query.rating = Number.parseInt(rating)
    }

    const reviews = await Review.find(query)
      .populate("student", "firstname lastname")
      .populate("booking", "date subject")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Review.countDocuments(query)

    // Calculate average rating
    const avgRating = await Review.aggregate([
      { $match: { teacher: mongoose.Types.ObjectId(teacherId), isVisible: true } },
      { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
    ])

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
        },
        statistics: {
          averageRating: avgRating[0]?.avgRating || 0,
          totalReviews: avgRating[0]?.count || 0,
        },
      },
    })
  } catch (error) {
    console.error("Get teacher reviews error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// Get student's reviews
exports.getStudentReviews = async (req, res) => {
  try {
    const studentId = req.user.id
    const { page = 1, limit = 10 } = req.query

    const reviews = await Review.find({ student: studentId })
      .populate("teacher", "firstname lastname email")
      .populate("booking", "date subject")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Review.countDocuments({ student: studentId })

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
        },
      },
    })
  } catch (error) {
    console.error("Get student reviews error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// Update review
exports.updateReview = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      })
    }

    const { reviewId } = req.params
    const { rating, comment } = req.body
    const studentId = req.user.id

    const review = await Review.findById(reviewId)
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      })
    }

    if (review.student.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own reviews",
      })
    }

    // Check if review is older than 7 days
    const daysSinceCreation = (Date.now() - review.createdAt) / (1000 * 60 * 60 * 24)
    if (daysSinceCreation > 7) {
      return res.status(400).json({
        success: false,
        message: "Reviews can only be updated within 7 days of creation",
      })
    }

    review.rating = rating
    review.comment = comment
    review.isModerated = false // Reset moderation status
    await review.save()

    await review.populate(["student", "teacher", "booking"])

    await updateTeacherStats(review.teacher._id)

    res.json({
      success: true,
      message: "Review updated successfully",
      data: review,
    })
  } catch (error) {
    console.error("Update review error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params
    const userId = req.user.id
    const userRole = req.user.role

    const review = await Review.findById(reviewId)
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      })
    }

    // Only student who created or admin can delete
    if (review.student.toString() !== userId && userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this review",
      })
    }

    await Review.findByIdAndDelete(reviewId)

    res.json({
      success: true,
      message: "Review deleted successfully",
    })
  } catch (error) {
    console.error("Delete review error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// Teacher response to review
exports.addTeacherResponse = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      })
    }

    const { reviewId } = req.params
    const { response } = req.body
    const teacherId = req.user.id

    const review = await Review.findById(reviewId)
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      })
    }

    if (review.teacher.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        message: "You can only respond to your own reviews",
      })
    }

    review.teacherResponse = response
    review.teacherResponseDate = new Date()
    await review.save()

    await review.populate(["student", "teacher", "booking"])

    res.json({
      success: true,
      message: "Response added successfully",
      data: review,
    })
  } catch (error) {
    console.error("Add teacher response error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// Admin: Get all reviews
exports.getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, rating, teacher, student } = req.query

    const query = {}
    if (status === "visible") query.isVisible = true
    if (status === "hidden") query.isVisible = false
    if (rating) query.rating = Number.parseInt(rating)
    if (teacher) query.teacher = teacher
    if (student) query.student = student

    const reviews = await Review.find(query)
      .populate("student", "firstname lastname email")
      .populate("teacher", "firstname lastname email")
      .populate("booking", "date subject")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Review.countDocuments(query)

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
        },
      },
    })
  } catch (error) {
    console.error("Get all reviews error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// Admin: Moderate review
exports.moderateReview = async (req, res) => {
  try {
    const { reviewId } = req.params
    const { isVisible, moderationNote } = req.body
    const adminId = req.user.id

    const review = await Review.findById(reviewId)
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      })
    }

    review.isVisible = isVisible
    review.isModerated = true
    review.moderatedBy = adminId
    review.moderationNote = moderationNote
    await review.save()

    await review.populate(["student", "teacher", "booking", "moderatedBy"])

    res.json({
      success: true,
      message: "Review moderated successfully",
      data: review,
    })
  } catch (error) {
    console.error("Moderate review error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// Get review statistics
exports.getReviewStats = async (req, res) => {
  try {
    const { teacherId } = req.params

    const stats = await Review.aggregate([
      { $match: { teacher: mongoose.Types.ObjectId(teacherId), isVisible: true } },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    const totalReviews = await Review.countDocuments({
      teacher: teacherId,
      isVisible: true,
    })

    const avgRating = await Review.aggregate([
      { $match: { teacher: mongoose.Types.ObjectId(teacherId), isVisible: true } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ])

    res.json({
      success: true,
      data: {
        ratingDistribution: stats,
        totalReviews,
        averageRating: avgRating[0]?.avgRating || 0,
      },
    })
  } catch (error) {
    console.error("Get review stats error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}
