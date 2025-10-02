const Complaint = require("../models/Complaint");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { validationResult } = require("express-validator");
const emailService = require("../utils/emailService");
const notificationService = require("../utils/notificationService");

// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Private/Student
exports.createComplaint = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { bookingId, title, description, category, severity = "medium" } = req.body;

    // Verify booking exists and belongs to the student
    const bookingDoc = await Booking.findOne({
      _id: bookingId,
      student: req.user.id,
      status: { $in: ["completed", "cancelled"] },
    }).populate("teacher", "firstname lastname email");

    if (!bookingDoc) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or access denied",
      });
    }

    // Check if complaint already exists for this booking
    const existingComplaint = await Complaint.findOne({
      booking: bookingId,
      student: req.user.id,
    });

    if (existingComplaint) {
      return res.status(400).json({
        success: false,
        message: "Complaint already exists for this booking",
      });
    }

    // Process attachments
    const attachments = req.files
      ? req.files.map((file) => ({
          filename: file.originalname,
          url: file.path,
        }))
      : [];

    // Create complaint
    const complaint = await Complaint.create({
      student: req.user.id,
      teacher: bookingDoc.teacher._id,
      booking: bookingId,
      title,
      description,
      category,
      severity,
      attachments,
    });

    await complaint.populate([
      { path: "student", select: "firstname lastname email" },
      { path: "teacher", select: "firstname lastname email" },
      { path: "booking", select: "date startTime endTime language" },
    ]);

    // Add initial message
    complaint.messages.push({
      sender: req.user.id,
      message: description,
    });
    await complaint.save();

    // Notify admins
    const admins = await User.find({ role: "admin", isActive: true });
    const adminNotifications = admins.map((admin) =>
      notificationService.createNotification({
        recipient: admin._id,
        sender: req.user.id,
        title: "New Complaint Filed",
        message: `${complaint.student.firstname} ${complaint.student.lastname} filed a complaint about ${complaint.teacher.firstname} ${complaint.teacher.lastname} regarding a ${bookingDoc.language} lesson`,
        type: "complaint_filed",
        relatedComplaint: complaint._id,
        priority: severity === "critical" ? "urgent" : severity === "high" ? "high" : "normal",
      })
    );

    await Promise.all(adminNotifications);

    // Send email notifications to admins
    if (admins.length > 0) {
      const emailPromises = admins.map((admin) =>
        emailService.sendEmail(
          admin.email,
          "New Complaint Filed - Language Teaching Center",
          `
            <h2>New Complaint Filed</h2>
            <p>A new complaint has been filed by ${complaint.student.firstname} ${complaint.student.lastname}.</p>
            <p><strong>Details:</strong></p>
            <ul>
              <li>Teacher: ${complaint.teacher.firstname} ${complaint.teacher.lastname}</li>
              <li>Category: ${category}</li>
              <li>Severity: ${severity}</li>
              <li>Booking Date: ${bookingDoc.date.toDateString()}</li>
              <li>Time: ${bookingDoc.startTime} - ${bookingDoc.endTime}</li>
            </ul>
            <p><strong>Title:</strong> ${title}</p>
            <p><strong>Description:</strong> ${description}</p>
            <p>Please log in to the admin dashboard to review and handle this complaint.</p>
          `
        )
      );
      await Promise.all(emailPromises);
    }

    res.status(201).json({
      success: true,
      data: complaint,
      message: "Complaint submitted successfully",
    });
  } catch (error) {
    console.error("Create complaint error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

// @desc    Get user's complaints
// @route   GET /api/complaints
// @access  Private
exports.getComplaints = async (req, res) => {
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
      // Admin can see all complaints
    }

    if (status && status !== "all") {
      query.status = status;
    }

    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("student", "firstname lastname email")
      .populate("teacher", "firstname lastname email")
      .populate("booking", "date startTime endTime language")
      .populate("resolvedBy", "firstname lastname email");

    const total = await Complaint.countDocuments(query);

    res.json({
      success: true,
      data: complaints,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get complaints error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

// @desc    Get single complaint
// @route   GET /api/complaints/:id
// @access  Private
exports.getComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("student", "firstname lastname email telegram")
      .populate("teacher", "firstname lastname email telegram")
      .populate("booking")
      .populate("resolvedBy", "firstname lastname email")
      .populate("messages.sender", "firstname lastname email role");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Check if user has access to this complaint
    if (
      req.user.role !== "admin" &&
      complaint.student._id.toString() !== req.user.id &&
      complaint.teacher._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    console.error("Get complaint error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

// @desc    Add message to complaint
// @route   POST /api/complaints/:id/messages
// @access  Private
exports.addMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { message } = req.body;

    const complaint = await Complaint.findById(req.params.id)
      .populate("student", "firstname lastname email")
      .populate("teacher", "firstname lastname email");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Check if user has access to this complaint
    if (
      req.user.role !== "admin" &&
      complaint.student._id.toString() !== req.user.id &&
      complaint.teacher._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Add message
    complaint.messages.push({
      sender: req.user.id,
      senderModel: "User",
      message,
      isAdminResponse: req.user.role === "admin",
    });

    // Update status if it was closed
    if (complaint.status === "closed") {
      complaint.status = "open";
    }

    await complaint.save();

    await complaint.populate("messages.sender", "firstname lastname email role");

    // Send notifications to relevant parties
    const notifyUsers = [];

    if (req.user.role === "admin") {
      // Admin responded, notify student and teacher
      notifyUsers.push(complaint.student._id, complaint.teacher._id);
    } else if (req.user.role === "student") {
      // Student responded, notify admins and teacher
      const admins = await User.find({ role: "admin" });
      notifyUsers.push(...admins.map((admin) => admin._id), complaint.teacher._id);
    } else if (req.user.role === "teacher") {
      // Teacher responded, notify admins and student
      const admins = await User.find({ role: "admin" });
      notifyUsers.push(...admins.map((admin) => admin._id), complaint.student._id);
    }

    // Remove the sender from notification list
    const filteredNotifyUsers = notifyUsers.filter((userId) => userId.toString() !== req.user.id);

    // Send notifications
    const notifications = filteredNotifyUsers.map((userId) =>
      notificationService.createNotification({
        recipient: userId,
        sender: req.user.id,
        title: "New Message in Complaint",
        message: `${req.user.firstname} ${req.user.lastname} added a message to complaint #${complaint._id}`,
        type: "complaint_message",
        relatedComplaint: complaint._id,
      })
    );

    await Promise.all(notifications);

    res.json({
      success: true,
      data: complaint,
      message: "Message added successfully",
    });
  } catch (error) {
    console.error("Add message error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update complaint status (Student/Teacher only)
// @route   PUT /api/complaints/:id/status
// @access  Private
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["open", "closed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Only "open" or "closed" allowed for users.',
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Check if user has access to this complaint
    if (complaint.student.toString() !== req.user.id && complaint.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    complaint.status = status;

    if (status === "closed") {
      complaint.closedAt = new Date();
      complaint.closedBy = req.user.id;
    }

    await complaint.save();

    await complaint.populate([
      { path: "student", select: "firstname lastname email" },
      { path: "teacher", select: "firstname lastname email" },
    ]);

    // Notify admins about status change
    const admins = await User.find({ role: "admin" });
    const adminNotifications = admins.map((admin) =>
      notificationService.createNotification({
        recipient: admin._id,
        sender: req.user.id,
        title: "Complaint Status Updated",
        message: `Complaint #${complaint._id} has been ${status} by ${req.user.firstname} ${req.user.lastname}`,
        type: "complaint_status_update",
        relatedComplaint: complaint._id,
      })
    );

    await Promise.all(adminNotifications);

    res.json({
      success: true,
      data: complaint,
      message: `Complaint ${status} successfully`,
    });
  } catch (error) {
    console.error("Update complaint status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Upload attachment to complaint
// @route   POST /api/complaints/:id/attachments
// @access  Private
exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Check if user has access to this complaint
    if (
      req.user.role !== "admin" &&
      complaint.student.toString() !== req.user.id &&
      complaint.teacher.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Add attachment
    complaint.attachments.push({
      filename: req.file.originalname,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user.id,
    });

    await complaint.save();

    res.json({
      success: true,
      data: complaint.attachments[complaint.attachments.length - 1],
      message: "Attachment uploaded successfully",
    });
  } catch (error) {
    console.error("Upload attachment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get complaint statistics
// @route   GET /api/complaints/stats
// @access  Private
exports.getComplaintStats = async (req, res) => {
  try {
    const query = {};

    if (req.user.role === "student") {
      query.student = req.user.id;
    } else if (req.user.role === "teacher") {
      query.teacher = req.user.id;
    }

    const stats = await Promise.all([
      Complaint.countDocuments({ ...query, status: "open" }),
      Complaint.countDocuments({ ...query, status: "in_progress" }),
      Complaint.countDocuments({ ...query, status: "resolved" }),
      Complaint.countDocuments({ ...query, status: "closed" }),
      Complaint.aggregate([{ $match: query }, { $group: { _id: "$priority", count: { $sum: 1 } } }]),
    ]);

    const [open, inProgress, resolved, closed, priorityStats] = stats;

    const priorityBreakdown = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    };

    priorityStats.forEach((stat) => {
      priorityBreakdown[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: {
        open,
        inProgress,
        resolved,
        closed,
        total: open + inProgress + resolved + closed,
        priorityBreakdown,
      },
    });
  } catch (error) {
    console.error("Get complaint stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};