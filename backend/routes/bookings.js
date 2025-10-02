const express = require("express");
const { body, validationResult, query } = require("express-validator");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { auth, authorize, requireApprovedTeacher } = require("../middleware/auth");
const { sendEmail, emailTemplates } = require("../utils/emailService");
const TeacherProfile = require("../models/TeacherProfile"); // Add this line

const router = express.Router();

// @route   POST /api/bookings
// @desc    Create a new booking (Student only)
// @access  Private (Student)
router.post(
  "/",
  auth,
  authorize("student"),
  [
    body("teacherId").isMongoId().withMessage("Valid teacher ID is required"),
    body("date").isISO8601().withMessage("Valid date is required"),
    body("startTime")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Valid start time is required (HH:MM format)"),
    body("endTime")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Valid end time is required (HH:MM format)"),
    body("language").notEmpty().withMessage("Language is required"),
    body("lessonType").optional().isIn(["individual", "group"]).withMessage("Invalid lesson type"),
    body("notes").optional().trim(),
    body("isRecurring").optional().isBoolean().withMessage("Is recurring must be boolean"),
    body("daysPerWeek")
      .if(body("isRecurring").equals(true))
      .isInt({ min: 1, max: 7 })
      .withMessage("Days per week must be between 1 and 7"),
    body("hoursPerDay")
      .if(body("isRecurring").equals(true))
      .isInt({ min: 1 })
      .withMessage("Hours per day must be at least 1"),
    body("specificDays")
      .if(body("isRecurring").equals(true))
      .isArray()
      .withMessage("Specific days must be an array")
      .custom((value) => {
        const validDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        return value.every((day) => validDays.includes(day.toLowerCase()));
      })
      .withMessage("Specific days must contain valid day names"),
  ],
  async (req, res) => {
    console.log("Raw request headers:", req.headers);
    console.log("Received request body:", req.body);
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { teacherId, date, startTime, endTime, language, lessonType, notes, isRecurring, daysPerWeek, hoursPerDay, specificDays } = req.body;

      console.log("Extracted teacherId:", teacherId);

      // Verify teacher exists and has a teacher profile
      const teacherUser = await User.findOne({
        _id: teacherId,
        role: "teacher",
        isactive: true,
      });

      if (!teacherUser) {
        console.log("Teacher user not found for ID:", teacherId);
        return res.status(404).json({ message: "Teacher not found or not active" });
      }

      // Get teacher profile with required fields
      const teacherProfile = await TeacherProfile.findOne({ 
        user: teacherId 
      }).populate('user', 'name email');

      if (!teacherProfile) {
        console.log("Teacher profile not found for user ID:", teacherId);
        return res.status(404).json({ message: "Teacher profile not found" });
      }

      // Check if teacher teaches the requested language
      if (!teacherProfile.language.includes(language)) {
        return res.status(400).json({ 
          message: "Teacher does not teach this language",
          availableLanguages: teacherProfile.language 
        });
      }

      // Calculate duration and price
      const start = new Date(`1970-01-01T${startTime}:00`);
      const end = new Date(`1970-01-01T${endTime}:00`);
      const duration = (end - start) / (1000 * 60 * 60); // Duration in hours

      if (duration <= 0 || (isRecurring && duration !== hoursPerDay)) {
        return res.status(400).json({ 
          message: "End time must be after start time and match hours per day for recurring bookings" 
        });
      }

      const price = duration * teacherProfile.hourlyRate;

      // Check for conflicting bookings
      const bookingDate = new Date(date);
      const conflictingBooking = await Booking.findOne({
        teacher: teacherId,
        date: bookingDate,
        status: { $in: ["pending", "confirmed"] },
        $or: [
          {
            startTime: { $lt: endTime },
            endTime: { $gt: startTime },
          },
        ],
      });

      if (conflictingBooking) {
        return res.status(400).json({ message: "Teacher is not available at this time" });
      }

      // Create booking
      const booking = new Booking({
        student: req.user.id,
        teacher: teacherId,
        date: bookingDate,
        startTime,
        endTime,
        duration,
        price,
        language,
        lessonType: lessonType || "individual",
        notes,
        isRecurring,
        daysPerWeek,
        hoursPerDay,
        specificDays,
      });

      await booking.save();

      // Populate booking details
      await booking.populate([
        { path: "student", select: "firstname lastname email" },
        { path: "teacher", select: "firstname lastname email" },
      ]);

      // Create notification for teacher
      const notification = new Notification({
        recipient: teacherId,
        sender: req.user.id,
        title: "New Booking Request",
        message: `${req.user.firstname} ${req.user.lastname} has requested a ${language} lesson on ${bookingDate.toDateString()} from ${startTime} to ${endTime}${
          isRecurring ? " (recurring)" : ""
        }`,
        type: "booking_request",
        relatedBooking: booking._id,
      });

      await notification.save();

      // Send email notification to teacher
      await sendEmail(
        teacherUser.email,
        "New Booking Request - Language Teaching Center",
        `
        <h2>New Booking Request</h2>
        <p>Dear ${teacherUser.firstname} ${teacherUser.lastname},</p>
        <p>You have received a new booking request from ${req.user.firstname} ${req.user.lastname}.</p>
        <p><strong>Details:</strong></p>
        <ul>
          <li>Language: ${language}</li>
          <li>Date: ${bookingDate.toDateString()}</li>
          <li>Time: ${startTime} - ${endTime}</li>
          <li>Duration: ${duration} hour(s)</li>
          <li>Price: $${price}</li>
          ${isRecurring ? `<li>Recurring: ${daysPerWeek} days/week, ${hoursPerDay} hours/day</li>` : ""}
        </ul>
        <p>Please log in to your dashboard to confirm or decline this booking.</p>
      `
      );

      res.status(201).json({
        message: "Booking request created successfully",
        booking,
      });
    } catch (error) {
      console.error("Create booking error:", error);
      res.status(500).json({ message: "Server error during booking creation" });
    }
  }
);
// @route   GET /api/bookings
// @desc    Get user's bookings
// @access  Private
router.get(
  "/",
  auth,
  [
    query("status")
      .optional()
      .isIn(["pending", "confirmed", "cancelled", "completed", "expired"])
      .withMessage("Invalid status"),
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const page = Number.parseInt(req.query.page) || 1;
      const limit = Number.parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Build filter based on user role
      const filter = {};
      if (req.user.role === "student") {
        filter.student = req.user.id;
      } else if (req.user.role === "teacher") {
        filter.teacher = req.user.id;
      } else if (req.user.role === "admin") {
        // Admin can see all bookings
      }

      if (req.query.status) {
        filter.status = req.query.status;
      }

      const bookings = await Booking.find(filter)
        .populate("student", "name email phone")
        .populate("teacher", "name email phone")
        .sort({ date: -1, startTime: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Booking.countDocuments(filter);

      res.json({
        bookings,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      console.error("Get bookings error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("student", "name email phone")
      .populate("teacher", "name email phone");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user has permission to view this booking
    if (req.user.role === "student" && booking.student._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    if (req.user.role === "teacher" && booking.teacher._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(booking);
  } catch (error) {
    console.error("Get booking error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/bookings/:id/confirm
// @desc    Confirm booking (Teacher only)
// @access  Private (Teacher)
router.put(
  "/:id/confirm",
  auth,
  authorize("teacher"),
  requireApprovedTeacher,
  [
    body("meetingLink").optional().isURL().withMessage("Valid meeting link is required"),
    body("location").optional().trim(),
    body("notes").optional().trim(),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { meetingLink, location, notes } = req.body;

      const booking = await Booking.findOne({
        _id: req.params.id,
        teacher: req.user.id,
        status: "pending",
      }).populate("student", "name email");

      if (!booking) {
        return res.status(404).json({ message: "Booking not found or already processed" });
      }

      // Update booking
      booking.status = "confirmed";
      booking.confirmedAt = new Date();
      if (meetingLink) booking.meetingLink = meetingLink;
      if (location) booking.location = location;
      if (notes) booking.notes = notes;

      await booking.save();

      // Create notification for student
      const notification = new Notification({
        recipient: booking.student._id,
        sender: req.user.id,
        title: "Booking Confirmed",
        message: `Your booking for ${booking.language} lesson on ${booking.date.toDateString()} has been confirmed`,
        type: "booking_confirmed",
        relatedBooking: booking._id,
      });

      await notification.save();

      // Send confirmation email to student
      const emailTemplate = emailTemplates.bookingConfirmationEmail(
        booking.student.name,
        req.user.name,
        booking.date.toDateString(),
        `${booking.startTime} - ${booking.endTime}`
      );

      await sendEmail(booking.student.email, emailTemplate.subject, emailTemplate.html);

      res.json({
        message: "Booking confirmed successfully",
        booking,
      });
    } catch (error) {
      console.error("Confirm booking error:", error);
      res.status(500).json({ message: "Server error during booking confirmation" });
    }
  }
);

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel booking
// @access  Private (Student or Teacher)
router.put(
  "/:id/cancel",
  auth,
  [body("reason").notEmpty().withMessage("Cancellation reason is required")],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { reason } = req.body;

      // Build filter based on user role
      const filter = { _id: req.params.id, status: { $in: ["pending", "confirmed"] } };
      if (req.user.role === "student") {
        filter.student = req.user.id;
      } else if (req.user.role === "teacher") {
        filter.teacher = req.user.id;
      }

      const booking = await Booking.findOne(filter)
        .populate("student", "name email")
        .populate("teacher", "name email");

      if (!booking) {
        return res.status(404).json({ message: "Booking not found or cannot be cancelled" });
      }

      // Update booking
      booking.status = "cancelled";
      booking.cancelledAt = new Date();
      booking.cancelReason = reason;

      await booking.save();

      // Create notification
      const recipient = req.user.role === "student" ? booking.teacher : booking.student;
      const recipientName = req.user.role === "student" ? booking.teacher.name : booking.student.name;

      const notification = new Notification({
        recipient: recipient._id,
        sender: req.user.id,
        title: "Booking Cancelled",
        message: `Your booking for ${booking.language} lesson on ${booking.date.toDateString()} has been cancelled. Reason: ${reason}`,
        type: "booking_cancelled",
        relatedBooking: booking._id,
      });

      await notification.save();

      // Send cancellation email
      await sendEmail(
        recipient.email,
        "Booking Cancelled - Language Teaching Center",
        `
        <h2>Booking Cancelled</h2>
        <p>Dear ${recipientName},</p>
        <p>Your booking for ${booking.language} lesson on ${booking.date.toDateString()} from ${booking.startTime} to ${booking.endTime} has been cancelled.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>If you have any questions, please contact support.</p>
      `
      );

      res.json({
        message: "Booking cancelled successfully",
        booking,
      });
    } catch (error) {
      console.error("Cancel booking error:", error);
      res.status(500).json({ message: "Server error during booking cancellation" });
    }
  }
);

// @route   PUT /api/bookings/:id/complete
// @desc    Mark booking as completed (Teacher only)
// @access  Private (Teacher)
router.put("/:id/complete", auth, authorize("teacher"), requireApprovedTeacher, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      teacher: req.user.id,
      status: "confirmed",
    }).populate("student", "name email");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found or not confirmed" });
    }

    // Check if the booking date has passed
    const now = new Date();
    const bookingDateTime = new Date(`${booking.date.toDateString()} ${booking.endTime}`);

    if (bookingDateTime > now) {
      return res.status(400).json({ message: "Cannot complete future bookings" });
    }

    // Update booking
    booking.status = "completed";
    await booking.save();

    // Create notification for student
    const notification = new Notification({
      recipient: booking.student._id,
      sender: req.user.id,
      title: "Lesson Completed",
      message: `Your ${booking.language} lesson on ${booking.date.toDateString()} has been completed`,
      type: "booking_confirmed",
      relatedBooking: booking._id,
    });

    await notification.save();

    res.json({
      message: "Booking marked as completed",
      booking,
    });
  } catch (error) {
    console.error("Complete booking error:", error);
    res.status(500).json({ message: "Server error during booking completion" });
  }
});

// @route   GET /api/bookings/teacher/:teacherId/availability
// @desc    Get teacher's availability for a specific date
// @access  Public
router.get(
  "/teacher/:teacherId/availability",
  [query("date").isISO8601().withMessage("Valid date is required")],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { teacherId } = req.params;
      const { date } = req.query;

      // Verify teacher exists and is approved
      const teacher = await User.findOne({
        _id: teacherId,
        role: "teacher",
        isApproved: true,
        isActive: true,
      });

      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }

      // Get existing bookings for the date
      const bookingDate = new Date(date);
      const existingBookings = await Booking.find({
        teacher: teacherId,
        date: bookingDate,
        status: { $in: ["pending", "confirmed"] },
      }).select("startTime endTime");

      // Get teacher's availability for the day
      const dayName = bookingDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      const dayAvailability = teacher.availability.find((avail) => avail.day === dayName);

      if (!dayAvailability) {
        return res.json({
          available: false,
          message: "Teacher is not available on this day",
          availableSlots: [],
        });
      }

      // Generate available time slots (assuming 1-hour slots)
      const availableSlots = [];
      const startHour = Number.parseInt(dayAvailability.startTime.split(":")[0]);
      const endHour = Number.parseInt(dayAvailability.endTime.split(":")[0]);

      for (let hour = startHour; hour < endHour; hour++) {
        const slotStart = `${hour.toString().padStart(2, "0")}:00`;
        const slotEnd = `${(hour + 1).toString().padStart(2, "0")}:00`;

        // Check if this slot conflicts with existing bookings
        const hasConflict = existingBookings.some((booking) => {
          return slotStart < booking.endTime && slotEnd > booking.startTime;
        });

        if (!hasConflict) {
          availableSlots.push({
            startTime: slotStart,
            endTime: slotEnd,
          });
        }
      }

      res.json({
        available: availableSlots.length > 0,
        availableSlots,
        teacherAvailability: dayAvailability,
      });
    } catch (error) {
      console.error("Get availability error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;