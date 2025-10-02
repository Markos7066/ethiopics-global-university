const mongoose = require("mongoose")

const teacherProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    title :{
      type: String,
      required: true,
      maxlength: 100,
    },
    photo: {
      type: String, // File path or URL
      required: true,
    },
    cv: {
      type: String, // File path or URL
      required: true,
    },
    language: [
      {
        type: String,
        required: true,
      },
    ],
    hourlyRate: {
      type: Number,
      required: true,
      min: 0,
    },
    totalReview: {
      type: Number,
      default: 0,
    },
    totalRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalStudent: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)


teacherProfileSchema.index({ language: 1 })
teacherProfileSchema.index({ hourlyRate: 1 })

module.exports = mongoose.model("TeacherProfile", teacherProfileSchema)
