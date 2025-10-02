const User = require("../models/User")
const TeacherProfile = require("../models/TeacherProfile")
const Booking = require("../models/Booking")
const Complaint = require("../models/Complaint")
const Payment = require("../models/Payment")
const Notification = require("../models/Notification")
const { validationResult } = require("express-validator")
const emailService = require("../utils/emailService")

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboard = async (req, res) => {
  try {
    const stats = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "teacher", isverified: true }),
      User.countDocuments({ role: "teacher", isverified: false }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "confirmed" }),
      Booking.countDocuments({ status: "pending" }),
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: "open" }),
      Payment.aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    ])

    const [
      totalStudents,
      approvedTeachers,
      pendingTeachers,
      totalBookings,
      confirmedBookings,
      pendingBookings,
      totalComplaints,
      openComplaints,
      totalRevenue,
    ] = stats

    res.json({
      success: true,
      data: {
        users: {
          totalStudents,
          approvedTeachers,
          pendingTeachers,
          totalTeachers: approvedTeachers + pendingTeachers,
        },
        bookings: {
          total: totalBookings,
          confirmed: confirmedBookings,
          pending: pendingBookings,
        },
        complaints: {
          total: totalComplaints,
          open: openComplaints,
          resolved: totalComplaints - openComplaints,
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
        },
      },
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// TEACHER MANAGEMENT
// @desc    Get all teachers
// @route   GET /api/admin/teachers
// @access  Private/Admin
exports.getTeachers = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const status = req.query.status // 'approved', 'pending', 'all'
    const search = req.query.search

    const query = { role: "teacher" }

    if (status && status !== "all") {
      query.isverified = status === "approved"
    }

    if (search) {
      query.$or = [
        { firstname: { $regex: search, $options: "i" } },
        { lastname: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ]
    }

    const teachers = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await User.countDocuments(query)

    res.json({
      success: true,
      data: teachers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get teachers error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// @desc    Get single teacher with CV and photo
// @route   GET /api/admin/teachers/:id
// @access  Private/Admin
exports.getTeacher = async (req, res) => {
  try {
    const teacher = await User.findOne({
      _id: req.params.id,
      role: "teacher",
    }).select("-password")

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      })
    }

    const teacherProfile = await TeacherProfile.findOne({ user: req.params.id }).populate(
      "approvedBy",
      "firstname lastname email",
    )

    const stats = await Promise.all([
      Booking.countDocuments({ teacher: req.params.id }),
      Booking.countDocuments({ teacher: req.params.id, status: "confirmed" }),
      Complaint.countDocuments({ teacher: req.params.id }),
      Payment.aggregate([
        { $match: { teacher: teacher._id, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ])

    const [totalBookings, confirmedBookings, totalComplaints, earnings] = stats

    res.json({
      success: true,
      data: {
        teacher,
        profile: teacherProfile,
        stats: {
          totalBookings,
          confirmedBookings,
          totalComplaints,
          totalEarnings: earnings[0]?.total || 0,
        },
      },
    })
  } catch (error) {
    console.error("Get teacher error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// @desc    Approve teacher
// @route   PUT /api/admin/teachers/:id/approve
// @access  Private/Admin
exports.approveTeacher = async (req, res) => {
  try {
    const teacher = await User.findOne({
      _id: req.params.id,
      role: "teacher",
    })

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      })
    }

    teacher.isverified = true
    await teacher.save()

    await emailService.sendTeacherApprovalEmail(teacher.email, `${teacher.firstname} ${teacher.lastname}`)

    await Notification.create({
      user: teacher._id,
      title: "Account Approved",
      message: "Your teacher account has been approved. You can now start accepting bookings.",
      type: "approval",
    })

    res.json({
      success: true,
      message: "Teacher approved successfully",
      data: teacher,
    })
  } catch (error) {
    console.error("Approve teacher error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// @desc    Reject teacher
// @route   PUT /api/admin/teachers/:id/reject
// @access  Private/Admin
exports.rejectTeacher = async (req, res) => {
  try {
    const { reason } = req.body

    const teacher = await User.findOne({
      _id: req.params.id,
      role: "teacher",
    })

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      })
    }

    teacher.isverified = false
    await teacher.save()

    await emailService.sendTeacherRejectionEmail(teacher.email, `${teacher.firstname} ${teacher.lastname}`, reason)

    await Notification.create({
      user: teacher._id,
      title: "Account Rejected",
      message: `Your teacher account has been rejected. Reason: ${reason}`,
      type: "rejection",
    })

    res.json({
      success: true,
      message: "Teacher rejected successfully",
      data: teacher,
    })
  } catch (error) {
    console.error("Reject teacher error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// @desc    Update teacher
// @route   PUT /api/admin/teachers/:id
// @access  Private/Admin
exports.updateTeacher = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      })
    }

    const {
      firstname,
      lastname,
      username,
      email,
      telegram,
      gender,
      bio,
      description,
      language,
      hourlyRate,
      isverified,
    } = req.body

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { firstname, lastname, username, email, telegram, gender, isverified },
      { new: true, runValidators: true },
    ).select("-password")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    const teacherProfile = await TeacherProfile.findOneAndUpdate(
      { user: req.params.id },
      {
        bio,
        description,
        language: language ? JSON.parse(language) : undefined,
        hourlyRate: Number.parseFloat(hourlyRate),
      },
      { new: true, runValidators: true },
    )

    res.json({
      success: true,
      data: { user, profile: teacherProfile },
    })
  } catch (error) {
    console.error("Update teacher error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// @desc    Delete teacher
// @route   DELETE /api/admin/teachers/:id
// @access  Private/Admin
exports.deleteTeacher = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user || user.role !== "teacher") {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      })
    }

    const activeBookings = await Booking.countDocuments({
      teacher: user._id,
      status: { $in: ["pending", "confirmed"] },
    })

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete teacher with active bookings",
      })
    }

    await TeacherProfile.findOneAndDelete({ user: req.params.id })
    await User.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "Teacher deleted successfully",
    })
  } catch (error) {
    console.error("Delete teacher error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// STUDENT MANAGEMENT
// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private/Admin
exports.getStudents = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const search = req.query.search

    const query = { role: "student" }

    if (search) {
      query.$or = [
        { firstname: { $regex: search, $options: "i" } },
        { lastname: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ]
    }

    const students = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await User.countDocuments(query)

    res.json({
      success: true,
      data: students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get students error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// @desc    Get single student
// @route   GET /api/admin/students/:id
// @access  Private/Admin
exports.getStudent = async (req, res) => {
  try {
    const student = await User.findOne({
      _id: req.params.id,
      role: "student",
    })
      .select("-password")
      .populate({
        path: "bookings",
        populate: {
          path: "teacher",
          select: "firstname lastname email subjects",
        },
      })
      .populate("complaints")

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      })
    }

    const stats = await Promise.all([
      Booking.countDocuments({ student: student._id }),
      Booking.countDocuments({ student: student._id, status: "confirmed" }),
      Complaint.countDocuments({ student: student._id }),
      Payment.aggregate([
        { $match: { student: student._id, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ])

    const [totalBookings, confirmedBookings, totalComplaints, totalSpent] = stats

    res.json({
      success: true,
      data: {
        student,
        stats: {
          totalBookings,
          confirmedBookings,
          totalComplaints,
          totalSpent: totalSpent[0]?.total || 0,
        },
      },
    })
  } catch (error) {
    console.error("Get student error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// @desc    Update student
// @route   PUT /api/admin/students/:id
// @access  Private/Admin
exports.updateStudent = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      })
    }

    const { firstname, lastname, username, email, telegram, gender } = req.body

    const student = await User.findOneAndUpdate(
      { _id: req.params.id, role: "student" },
      { firstname, lastname, username, email, telegram, gender },
      { new: true, runValidators: true },
    ).select("-password")

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      })
    }

    res.json({
      success: true,
      data: student,
    })
  } catch (error) {
    console.error("Update student error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// @desc    Delete student
// @route   DELETE /api/admin/students/:id
// @access  Private/Admin
exports.deleteStudent = async (req, res) => {
  try {
    const student = await User.findOne({
      _id: req.params.id,
      role: "student",
    })

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      })
    }

    const activeBookings = await Booking.countDocuments({
      student: student._id,
      status: { $in: ["pending", "confirmed"] },
    })

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete student with active bookings",
      })
    }

    await User.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "Student deleted successfully",
    })
  } catch (error) {
    console.error("Delete student error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// COMPLAINT MANAGEMENT
// @desc    Get all complaints
// @route   GET /api/admin/complaints
// @access  Private/Admin
exports.getComplaints = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const status = req.query.status
    const priority = req.query.priority

    const query = {}

    if (status && status !== "all") {
      query.status = status
    }

    if (priority && priority !== "all") {
      query.priority = priority
    }

    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("student", "firstname lastname email telegram")
      .populate("teacher", "firstname lastname email telegram")
      .populate("booking")
      .populate("resolvedBy", "firstname lastname email")

    const total = await Complaint.countDocuments(query)

    res.json({
      success: true,
      data: complaints,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get complaints error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// @desc    Get single complaint
// @route   GET /api/admin/complaints/:id
// @access  Private/Admin
exports.getComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("student", "firstname lastname email")
      .populate("teacher", "firstname lastname email")
      .populate("booking")
      .populate("resolvedBy", "firstname lastname email")

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      })
    }

    res.json({
      success: true,
      data: complaint,
    })
  } catch (error) {
    console.error("Get complaint error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// @desc    Update complaint status
// @route   PUT /api/admin/complaints/:id/status
// @access  Private/Admin
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status, resolution, priority } = req.body

    const updateData = { status }

    if (priority) updateData.priority = priority

    if (status === "resolved") {
      updateData.resolution = resolution
      updateData.resolvedAt = new Date()
      updateData.resolvedBy = req.user.id
    }

    const complaint = await Complaint.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
      .populate("student", "firstname lastname email")
      .populate("teacher", "firstname lastname email")

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      })
    }

    await Notification.create({
      user: complaint.student._id,
      title: "Complaint Updated",
      message: `Your complaint has been ${status}. ${resolution || ""}`,
      type: "complaint_update",
    })

    if (status === "resolved") {
      await emailService.sendComplaintResolutionEmail(
        complaint.student.email,
        complaint.student.firstname + " " + complaint.student.lastname,
        complaint.subject,
        resolution,
      )
    }

    res.json({
      success: true,
      data: complaint,
    })
  } catch (error) {
    console.error("Update complaint status error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// @desc    Add admin response to complaint
// @route   POST /api/admin/complaints/:id/response
// @access  Private/Admin
exports.addComplaintResponse = async (req, res) => {
  try {
    const { message } = req.body

    const complaint = await Complaint.findById(req.params.id)

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      })
    }

    complaint.messages.push({
      sender: req.user.id,
      senderModel: "User",
      message,
      isAdminResponse: true,
    })

    await complaint.save()

    await complaint.populate([
      { path: "student", select: "firstname lastname email" },
      { path: "teacher", select: "firstname lastname email" },
      { path: "messages.sender", select: "firstname lastname email role" },
    ])

    await Notification.create({
      user: complaint.student._id,
      title: "New Response to Your Complaint",
      message: "An admin has responded to your complaint.",
      type: "complaint_response",
    })

    res.json({
      success: true,
      data: complaint,
    })
  } catch (error) {
    console.error("Add complaint response error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// @desc    Delete complaint
// @route   DELETE /api/admin/complaints/:id
// @access  Private/Admin
exports.deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      })
    }

    await Complaint.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "Complaint deleted successfully",
    })
  } catch (error) {
    console.error("Delete complaint error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// BOOKING MANAGEMENT
// @desc    Get all bookings
// @route   GET /api/admin/bookings
// @access  Private/Admin
exports.getBookings = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const status = req.query.status
    const dateFrom = req.query.dateFrom
    const dateTo = req.query.dateTo

    const query = {}

    if (status && status !== "all") {
      query.status = status
    }

    if (dateFrom || dateTo) {
      query.date = {}
      if (dateFrom) query.date.$gte = new Date(dateFrom)
      if (dateTo) query.date.$lte = new Date(dateTo)
    }

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("student", "firstname lastname email")
      .populate("teacher", "firstname lastname email")
      .populate("payment")

    const total = await Booking.countDocuments(query)

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get bookings error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// @desc    Update booking status
// @route   PUT /api/admin/bookings/:id/status
// @access  Private/Admin
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status, reason } = req.body

    const booking = await Booking.findById(req.params.id)
      .populate("student", "firstname lastname email")
      .populate("teacher", "firstname lastname email")

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      })
    }

    booking.status = status
    if (reason) booking.cancellationReason = reason

    if (status === "cancelled") {
      booking.cancelledAt = new Date()
      booking.cancelledBy = req.user.id
    }

    await booking.save()

    await Promise.all([
      Notification.create({
        user: booking.student._id,
        title: "Booking Status Updated",
        message: `Your booking has been ${status}. ${reason || ""}`,
        type: "booking_update",
      }),
      Notification.create({
        user: booking.teacher._id,
        title: "Booking Status Updated",
        message: `A booking has been ${status} by admin. ${reason || ""}`,
        type: "booking_update",
      }),
    ])

    res.json({
      success: true,
      data: booking,
    })
  } catch (error) {
    console.error("Update booking status error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}
