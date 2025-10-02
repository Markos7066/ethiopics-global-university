const Booking = require("../models/Booking");
const User = require("../models/User");
const Payment = require("../models/Payment");
const Notification = require("../models/Notification");
const { validationResult } = require("express-validator");
const emailService = require("../utils/emailService");
const notificationService = require("../utils/notificationService");

exports.createBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { teacherId, date, startTime, endTime, language, lessonType, notes, isRecurring, daysPerWeek, hoursPerDay, specificDays } = req.body;

    // Check if teacher exists and is approved
    const teacherUser = await User.findOne({
      _id: teacherId,
      role: "teacher",
      isApproved: true,
      isActive: true,
    });

    if (!teacherUser) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found or not approved",
      });
    }

    // Check if teacher teaches the requested language
    if (!teacherUser.languages.includes(language)) {
      return res.status(400).json({
        success: false,
        message: "Teacher does not teach this language",
      });
    }

    // Calculate duration and price per session
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    const duration = (end - start) / (1000 * 60 * 60); // Duration in hours

    if (duration <= 0 || duration !== hoursPerDay) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time and match hours per day",
      });
    }

    const pricePerSession = duration * (teacherUser.hourlyRate || 50);

    // Handle recurring booking
    let bookings = [];
    if (isRecurring && daysPerWeek && hoursPerDay && specificDays) {
      const startDate = new Date(date);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0); // End of month
      const totalHoursPerMonth = daysPerWeek * hoursPerDay * 4; // Approximate 4 weeks
      const totalCost = totalHoursPerMonth * pricePerSession;

      // Create parent booking
      const parentBooking = await Booking.create({
        student: req.user.id,
        teacher: teacherId,
        date: startDate,
        startTime,
        endTime,
        duration,
        price: pricePerSession,
        language,
        lessonType: lessonType || "individual",
        notes,
        isRecurring: true,
        daysPerWeek,
        hoursPerDay,
        specificDays,
        totalHoursPerMonth,
        totalCost,
        status: "pending",
      });

      // Generate child bookings for the month
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayName = currentDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
        if (specificDays.includes(dayName)) {
          const newBooking = new Booking({
            student: req.user.id,
            teacher: teacherId,
            date: new Date(currentDate),
            startTime,
            endTime,
            duration,
            price: pricePerSession,
            language,
            lessonType: lessonType || "individual",
            notes,
            isRecurring: true,
            parentBooking: parentBooking._id,
            status: "pending",
          });

          // Check for conflicts
          const conflictingBooking = await Booking.findOne({
            teacher: teacherId,
            date: newBooking.date,
            status: { $in: ["pending", "confirmed"] },
            $or: [
              {
                startTime: { $lt: newBooking.endTime },
                endTime: { $gt: newBooking.startTime },
              },
            ],
          });

          if (!conflictingBooking) {
            await newBooking.save();
            bookings.push(newBooking);
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      await parentBooking.save();
      bookings.unshift(parentBooking); // Include parent in response
    } else {
      // Single booking
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
        return res.status(400).json({
          success: false,
          message: "Teacher is not available at this time",
        });
      }

      const booking = await Booking.create({
        student: req.user.id,
        teacher: teacherId,
        date: bookingDate,
        startTime,
        endTime,
        duration,
        price: pricePerSession,
        language,
        lessonType: lessonType || "individual",
        notes,
        status: "pending",
      });

      bookings.push(booking);
    }

    // Populate booking details
    await Promise.all(
      bookings.map(async (booking) => {
        await booking.populate([
          { path: "student", select: "name email" },
          { path: "teacher", select: "name email" },
        ]);
      })
    );

    // Notify teacher for the first booking
    const firstBooking = bookings[0];
    const notification = new Notification({
      recipient: teacherId,
      sender: req.user.id,
      title: "New Booking Request",
      message: `${req.user.name} has requested a ${language} lesson on ${firstBooking.date.toDateString()} from ${startTime} to ${endTime}${
        isRecurring ? " (recurring)" : ""
      }`,
      type: "booking_request",
      relatedBooking: firstBooking._id,
    });

    await notification.save();

    // Send email notification to teacher
    await sendEmail(
      teacherUser.email,
      "New Booking Request - Language Teaching Center",
      `
        <h2>New Booking Request</h2>
        <p>Dear ${teacherUser.name},</p>
        <p>You have received a new booking request from ${req.user.name}.</p>
        <p><strong>Details:</strong></p>
        <ul>
          <li>Language: ${language}</li>
          <li>Start Date: ${firstBooking.date.toDateString()}</li>
          <li>Time: ${startTime} - ${endTime}</li>
          <li>Duration: ${duration} hour(s)</li>
          <li>Price per Session: $${pricePerSession}</li>
          ${isRecurring ? `<li>Recurring: ${daysPerWeek} days/week, ${hoursPerDay} hours/day</li>` : ""}
          ${isRecurring ? `<li>Total Cost: $${firstBooking.totalCost}</li>` : ""}
        </ul>
        <p>Please log in to your dashboard to confirm or decline this booking.</p>
      `
    );

    res.status(201).json({
      success: true,
      data: bookings,
      message: isRecurring ? "Recurring booking series created successfully" : "Booking request created successfully",
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get user's bookings
// @route   GET /api/bookings
// @access  Private
exports.getBookings = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;
    const status = req.query.status;

    const query = {};

    // Filter by user role
    if (req.user.role === "student") {
      query.student = req.user.id;
    } else if (req.user.role === "teacher") {
      query.teacher = req.user.id;
    } else if (req.user.role === "admin") {
      // Admin can see all bookings
    }

    if (status && status !== "all") {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("student", "name email phone")
      .populate("teacher", "name email phone subjects")
      .populate("parentBooking");

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("student", "name email phone")
      .populate("teacher", "name email phone subjects")
      .populate("parentBooking");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user has access to this booking
    if (
      req.user.role !== "admin" &&
      booking.student._id.toString() !== req.user.id &&
      booking.teacher._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Get booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Confirm booking (Teacher only)
// @route   PUT /api/bookings/:id/confirm
// @access  Private/Teacher
exports.confirmBooking = async (req, res) => {
  try {
    const { meetingLink, location, notes } = req.body;

    const booking = await Booking.findOne({
      _id: req.params.id,
      teacher: req.user.id,
      status: "pending",
    }).populate("student", "name email");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or already processed",
      });
    }

    // Update booking
    booking.status = "confirmed";
    booking.confirmedAt = new Date();
    if (meetingLink) booking.meetingLink = meetingLink;
    if (location) booking.location = location;
    if (notes) booking.notes = notes;

    await booking.save();

    // If this is a child booking, update parent status
    if (booking.parentBooking) {
      const parent = await Booking.findById(booking.parentBooking);
      if (parent && parent.status === "pending") {
        const confirmedChildren = await Booking.countDocuments({
          parentBooking: parent._id,
          status: "confirmed",
        });
        if (confirmedChildren === parent.daysPerWeek * 4) {
          parent.status = "confirmed";
          await parent.save();
        }
      }
    }

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
      success: true,
      data: booking,
      message: "Booking confirmed successfully",
    });
  } catch (error) {
    console.error("Confirm booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Reject booking (Teacher only)
// @route   PUT /api/bookings/:id/reject
// @access  Private/Teacher
exports.rejectBooking = async (req, res) => {
  try {
    const { reason } = req.body;

    const booking = await Booking.findOne({
      _id: req.params.id,
      teacher: req.user.id,
      status: "pending",
    }).populate("student", "name email");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or already processed",
      });
    }

    booking.status = "rejected";
    booking.rejectedAt = new Date();
    booking.rejectionReason = reason;
    await booking.save();

    // If this is a child booking, update parent status
    if (booking.parentBooking) {
      const parent = await Booking.findById(booking.parentBooking);
      if (parent) {
        parent.status = "rejected";
        await parent.save();
      }
    }

    // Send notifications
    await Promise.all([
      // Notify student
      notificationService.createNotification({
        user: booking.student._id,
        title: "Booking Rejected",
        message: `Your booking has been rejected. Reason: ${reason}`,
        type: "booking_rejected",
        relatedId: booking._id,
      }),

      // Send email to student
      emailService.sendBookingRejectionEmail(booking.student.email, booking.student.name, booking.language, reason),
    ]);

    res.json({
      success: true,
      data: booking,
      message: "Booking rejected",
    });
  } catch (error) {
    console.error("Reject booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;

    const query = { _id: req.params.id };

    // Students can only cancel their own bookings, teachers can cancel bookings assigned to them
    if (req.user.role === "student") {
      query.student = req.user.id;
    } else if (req.user.role === "teacher") {
      query.teacher = req.user.id;
    }

    const booking = await Booking.findOne(query)
      .populate("student", "name email")
      .populate("teacher", "name email")
      .populate("parentBooking");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status === "cancelled" || booking.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Booking cannot be cancelled",
      });
    }

    // Check if booking is within 24 hours
    const bookingEnd = new Date(`${booking.date.toDateString()} ${booking.endTime}`);
    const now = new Date();
    const timeDiff = bookingEnd.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);

    if (hoursDiff < 24) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel booking within 24 hours of scheduled time",
      });
    }

    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    booking.cancelledBy = req.user.id;
    booking.cancelReason = reason;
    await booking.save();

    // If this is a child booking, update parent status
    if (booking.parentBooking) {
      const parent = await Booking.findById(booking.parentBooking);
      if (parent) {
        const cancelledChildren = await Booking.countDocuments({
          parentBooking: parent._id,
          status: "cancelled",
        });
        if (cancelledChildren === parent.daysPerWeek * 4) {
          parent.status = "cancelled";
          await parent.save();
        }
      }
    }

    // Determine who to notify
    const notifyUser = req.user.role === "student" ? booking.teacher._id : booking.student._id;
    const notifyEmail = req.user.role === "student" ? booking.teacher.email : booking.student.email;
    const notifyName = req.user.role === "student" ? booking.teacher.name : booking.student.name;

    // Send notifications
    await Promise.all([
      // Notify the other party
      notificationService.createNotification({
        user: notifyUser,
        title: "Booking Cancelled",
        message: `A booking has been cancelled. Reason: ${reason}`,
        type: "booking_cancelled",
        relatedId: booking._id,
      }),

      // Send email
      emailService.sendBookingCancellationEmail(notifyEmail, notifyName, booking.language, booking.date, reason),
    ]);

    // Process refund if payment was made
    if (booking.payment && booking.payment.status === "completed") {
      // Initiate refund process (integrate with payment processor)
    }

    res.json({
      success: true,
      data: booking,
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Complete booking (Teacher only)
// @route   PUT /api/bookings/:id/complete
// @access  Private/Teacher
exports.completeBooking = async (req, res) => {
  try {
    const { notes } = req.body;

    const booking = await Booking.findOne({
      _id: req.params.id,
      teacher: req.user.id,
      status: "confirmed",
    }).populate("student", "name email");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or not confirmed",
      });
    }

    // Check if the booking date has passed
    const now = new Date();
    const bookingDateTime = new Date(`${booking.date.toDateString()} ${booking.endTime}`);

    if (bookingDateTime > now) {
      return res.status(400).json({
        success: false,
        message: "Cannot complete future bookings",
      });
    }

    booking.status = "completed";
    booking.completedAt = new Date();
    booking.teacherNotes = notes;
    await booking.save();

    // If this is a child booking, update parent status
    if (booking.parentBooking) {
      const parent = await Booking.findById(booking.parentBooking);
      if (parent) {
        const completedChildren = await Booking.countDocuments({
          parentBooking: parent._id,
          status: "completed",
        });
        if (completedChildren === parent.daysPerWeek * 4) {
          parent.status = "completed";
          await parent.save();
        }
      }
    }

    // Send notification to student
    await notificationService.createNotification({
      user: booking.student._id,
      title: "Lesson Completed",
      message: "Your lesson has been completed. Please rate your experience.",
      type: "booking_completed",
      relatedId: booking._id,
    });

    res.json({
      success: true,
      data: booking,
      message: "Booking completed successfully",
    });
  } catch (error) {
    console.error("Complete booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Rate booking (Student only)
// @route   PUT /api/bookings/:id/rate
// @access  Private/Student
exports.rateBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { rating, review } = req.body;

    const booking = await Booking.findOne({
      _id: req.params.id,
      student: req.user.id,
      status: "completed",
    }).populate("teacher", "name email");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or not completed",
      });
    }

    if (booking.rating) {
      return res.status(400).json({
        success: false,
        message: "Booking already rated",
      });
    }

    booking.rating = rating;
    booking.review = review;
    booking.ratedAt = new Date();
    await booking.save();

    // Update teacher's average rating
    const teacherBookings = await Booking.find({
      teacher: booking.teacher._id,
      rating: { $exists: true },
    });

    const averageRating = teacherBookings.reduce((sum, b) => sum + b.rating, 0) / teacherBookings.length;

    await User.findByIdAndUpdate(booking.teacher._id, {
      rating: averageRating,
      totalReviews: teacherBookings.length,
    });

    // Send notification to teacher
    await notificationService.createNotification({
      user: booking.teacher._id,
      title: "New Review Received",
      message: `You received a ${rating}-star review from ${req.user.name}`,
      type: "review_received",
      relatedId: booking._id,
    });

    res.json({
      success: true,
      data: booking,
      message: "Rating submitted successfully",
    });
  } catch (error) {
    console.error("Rate booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get teacher's schedule
// @route   GET /api/bookings/teacher/schedule
// @access  Private/Teacher
exports.getTeacherSchedule = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    }

    const bookings = await Booking.find({
      teacher: req.user.id,
      status: { $in: ["confirmed", "completed"] },
      ...dateQuery,
    })
      .populate("student", "name email phone")
      .sort({ date: 1 });

    res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Get teacher schedule error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get booking statistics
// @route   GET /api/bookings/stats
// @access  Private
exports.getBookingStats = async (req, res) => {
  try {
    const query = {};

    if (req.user.role === "student") {
      query.student = req.user.id;
    } else if (req.user.role === "teacher") {
      query.teacher = req.user.id;
    }

    const stats = await Promise.all([
      Booking.countDocuments({ ...query, status: "pending" }),
      Booking.countDocuments({ ...query, status: "confirmed" }),
      Booking.countDocuments({ ...query, status: "completed" }),
      Booking.countDocuments({ ...query, status: "cancelled" }),
      Booking.aggregate([
        { $match: { ...query, status: "completed" } },
        { $group: { _id: null, avgRating: { $avg: "$rating" } } },
      ]),
    ]);

    const [pending, confirmed, completed, cancelled, avgRating] = stats;

    res.json({
      success: true,
      data: {
        pending,
        confirmed,
        completed,
        cancelled,
        total: pending + confirmed + completed + cancelled,
        averageRating: avgRating[0]?.avgRating || 0,
      },
    });
  } catch (error) {
    console.error("Get booking stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};