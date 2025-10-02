const User = require("../models/User");
const TeacherProfile = require("../models/TeacherProfile");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
const emailService = require("../utils/emailService");
const config = require("../config/config");
const cloudinary = require("../config/cloudinary");

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || "tomtech21",
    { expiresIn: "1h" }
  );
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    console.log("Raw Request body:", req.body); // Debug raw body
    console.log("Raw Request files:", req.files); // Debug raw files

    // Clean and map request body to handle spaced keys
    const cleanBody = {};
    for (const [key, value] of Object.entries(req.body)) {
      const cleanedKey = key.trim();
      const cleanedValue = typeof value === "string" ? value.trim().replace(/^"|"$/g, "") : value;
      cleanBody[cleanedKey] = cleanedValue;
    }
    console.log("Cleaned Request body:", cleanBody); // Debug cleaned body

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { firstname, lastname, email, password, role, telegram, gender, phone, bio, description, title, language, hourlyRate } = cleanBody;

    // Check if user exists by email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Validate role and ensure teacher-specific fields are present if role is teacher
    const validRoles = ["student", "teacher", "admin"];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing role specified",
      });
    }

    if (role === "teacher") {
      if (!req.files || !req.files.cv || !req.files.photo) {
        return res.status(400).json({
          success: false,
          message: "CV and photo are required for teacher registration",
        });
      }
      if (!bio || !description || !title || !language || !hourlyRate) {
        return res.status(400).json({
          success: false,
          message: "Bio, description, title, language, and hourly rate are required for teacher registration",
        });
      }
    }

    const userData = {
      firstname,
      lastname,
      email,
      password,
      role,
      telegram,
      gender,
      phone,
      isactive: true,
    };

    console.log("User data to create:", userData); // Debug data before creation

    const user = await User.create(userData);

    let photoUrl = "";
    let cvUrl = "";

    if (role === "teacher") {
      let parsedLanguages = [];
      if (language) {
        if (Array.isArray(language)) {
          parsedLanguages = language;
        } else if (typeof language === "string") {
          try {
            parsedLanguages = JSON.parse(language);
          } catch (err) {
            parsedLanguages = language.split(",").map((l) => l.trim());
          }
        }
      }

      // Upload photo to Cloudinary
      const photoUpload = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "image",
              folder: process.env.CLOUDINARY_FOLDER || "ethiopics-university/teachers/photos",
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result.secure_url);
            }
          )
          .end(req.files.photo[0].buffer);
      });
      photoUrl = photoUpload;

      // Upload CV to Cloudinary
      const cvUpload = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "raw",
              folder: process.env.CLOUDINARY_FOLDER || "ethiopics-university/teachers/cvs",
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result.secure_url);
            }
          )
          .end(req.files.cv[0].buffer);
      });
      cvUrl = cvUpload;

      await TeacherProfile.create({
        user: user._id,
        bio,
        description,
        title,
        photo: photoUrl,
        cv: cvUrl,
        language: parsedLanguages,
        hourlyRate: Number.parseFloat(hourlyRate) || 0,
      });

      // Notify admin about new teacher registration
      const admins = await User.find({ role: "admin" });
      for (const admin of admins) {
        await emailService.sendTeacherRegistrationNotification(admin.email, user);
      }
    }

    await emailService.sendWelcomeEmail(user.email, `${user.firstname} ${user.lastname}`);

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        isverified: user.isverified,
      },
      message: role === "teacher" ? "Registration successful. Awaiting admin approval." : "Registration successful",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Check for user by email
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is active
    if (!user.isactive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (user.role === "teacher" && !user.isverified) {
      return res.status(403).json({
        success: false,
        message: "Account pending verification",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        isverified: user.isverified,
        isactive: user.isactive,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { firstname, lastname, email, telegram, gender, username } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: req.user.id },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    const updateData = {
      firstname,
      lastname,
      ...(email && { email }),
      ...(telegram && { telegram }),
      ...(gender && { gender }),
      ...(username && { username }),
    };

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select("+password");

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Send reset email
    const resetUrl = `${config.frontendUrl}/reset-password/${resetToken}`;
    await emailService.sendPasswordResetEmail(user.email, resetUrl, `${user.firstname} ${user.lastname}`);

    res.json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};