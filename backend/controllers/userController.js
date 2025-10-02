const User = require("../models/User")
const TeacherProfile = require("../models/TeacherProfile")
const Booking = require("../models/Booking")
const { validationResult } = require("express-validator")

// @desc    Get all approved teachers
// @route   GET /api/users/teachers
// @access  Public
exports.getTeachers = async (req, res) => {
  try {
    const language = req.query.language
    const gender = req.query.gender
    const search = req.query.search

    const baseMatch = { role: "teacher", isverified: true, isactive: true }

    const pipeline = [
      { $match: baseMatch },
      {
        $lookup: {
          from: "teacherprofiles",
          localField: "_id",
          foreignField: "user",
          as: "profile",
        },
      },
      { $unwind: "$profile" },
    ]

    // Language filter
    if (language) {
      pipeline.push({ $match: { "profile.language": { $in: [language] } } })
    }

    // Gender filter
    if (gender) {
      pipeline.push({ $match: { gender } })
    }

    // Search filter
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { firstname: { $regex: search, $options: "i" } },
            { lastname: { $regex: search, $options: "i" } },
            { "profile.description": { $regex: search, $options: "i" } },
            { "profile.language": { $regex: search, $options: "i" } },
          ],
        },
      })
    }

    // Merge user + profile fields
    pipeline.push({
      $project: {
        _id: 1,
        firstname: 1,
        lastname: 1,
        email: 1,
        gender: 1,
        role: 1,
        createdAt: 1,
        "profile.title": 1,
        "profile.description": 1,
        "profile.photo": 1,
        "profile.cv": 1,
        "profile.language": 1,
        "profile.hourlyRate": 1,
        "profile.totalReview": 1,
        "profile.totalRating": 1,
        "profile.totalStudent": 1,
      },
    })

    // Flatten: merge profile fields into root
    pipeline.push({
      $replaceRoot: {
        newRoot: { $mergeObjects: ["$profile", "$$ROOT"] },
      },
    })

    // Remove nested profile after merge
    pipeline.push({
      $project: { profile: 0, password: 0, resetPasswordToken: 0, resetPasswordExpire: 0 },
    })

    const teachers = await User.aggregate(pipeline)

    res.json({
      success: true,
      count: teachers.length,
      data: teachers,
    })
  } catch (error) {
    console.error("Get teachers error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// @desc    Get single teacher
// @route   GET /api/users/teachers/:id
// @access  Public
exports.getTeacher = async (req, res) => {
  try {
    const teacher = await User.findOne({
      _id: req.params.id,
      role: "teacher",
      isverified: true,
      isactive: true,
    }).select("-password -resetPasswordToken -resetPasswordExpire")

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      })
    }

    const teacherProfile = await TeacherProfile.findOne({ user: req.params.id })

    // Get teacher's confirmed bookings count
    const stats = await Booking.aggregate([
      { $match: { teacher: teacher._id, status: "confirmed" } },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
        },
      },
    ])

    const teacherData = {
      ...teacher.toObject(),
      profile: teacherProfile,
      stats: {
        totalBookings: stats[0]?.totalBookings || 0,
      },
    }

    res.json({
      success: true,
      data: teacherData,
    })
  } catch (error) {
    console.error("Get teacher error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// @desc    Get all languages
// @route   GET /api/users/languages
// @access  Public
exports.getLanguages = async (req, res) => {
  try {
    const languages = await TeacherProfile.aggregate([
      { $unwind: "$language" },
      { $group: { _id: "$language", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { language: "$_id", count: 1, _id: 0 } },
    ])

    res.json({
      success: true,
      data: languages,
    })
  } catch (error) {
    console.error("Get languages error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// @desc    Upload CV
// @route   POST /api/users/upload-cv
// @access  Private/Teacher
exports.uploadCV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      })
    }

    const user = await User.findById(req.user.id)

    if (user.role !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "Only teachers can upload CV",
      })
    }

    const teacherProfile = await TeacherProfile.findOneAndUpdate(
      { user: req.user.id },
      { cv: req.file.path },
      { new: true },
    )

    res.json({
      success: true,
      message: "CV uploaded successfully",
      data: {
        cvUrl: teacherProfile.cv,
      },
    })
  } catch (error) {
    console.error("Upload CV error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}
