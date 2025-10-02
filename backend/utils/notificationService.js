const Notification = require("../models/Notification")
const { sendEmail } = require("./emailService")

// Create and send notification
const createNotification = async (notificationData) => {
  try {
    const notification = new Notification(notificationData)
    await notification.save()

    // If email channel is enabled, send email
    if (notification.channels.email) {
      await sendNotificationEmail(notification)
    }

    return notification
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

// Send notification email
const sendNotificationEmail = async (notification) => {
  try {
    // Populate recipient with firstname, lastname, and email
    await notification.populate("recipient", "firstname lastname email");

    // Construct the full name from firstname and lastname
    const recipientName = `${notification.recipient.firstname || ""} ${notification.recipient.lastname || ""}`.trim();

    const emailSubject = `${notification.title} - Language Teaching Center`;
    const emailBody = `
      <h2>${notification.title}</h2>
      <p>Dear ${recipientName || "User"},</p> <!-- Fallback to "User" if no name -->
      <p>${notification.message}</p>
      ${
        notification.actions && notification.actions.length > 0
          ? `
      <div style="margin: 20px 0;">
        ${notification.actions
          .map(
            (action) => `
          <a href="${action.url}" style="
            display: inline-block;
            padding: 10px 20px;
            margin: 5px;
            background-color: ${action.style === "primary" ? "#007bff" : action.style === "danger" ? "#dc3545" : "#6c757d"};
            color: white;
            text-decoration: none;
            border-radius: 5px;
          ">${action.label}</a>
        `,
          )
          .join("")}
      </div>
    `
          : ""
      }
      <p>Best regards,<br>Language Teaching Center Team</p>
    `;

    await sendEmail(notification.recipient.email, emailSubject, emailBody);

    // Update delivery status
    notification.deliveryStatus.email = "sent";
    await notification.save();
  } catch (error) {
    console.error("Error sending notification email:", error);
    notification.deliveryStatus.email = "failed";
    await notification.save();
    throw error;
  }
};
// Bulk create notifications
const createBulkNotifications = async (notifications) => {
  try {
    const createdNotifications = await Notification.insertMany(notifications)

    // Send emails for notifications with email channel enabled
    const emailPromises = createdNotifications
      .filter((notification) => notification.channels.email)
      .map((notification) => sendNotificationEmail(notification))

    await Promise.allSettled(emailPromises)

    return createdNotifications
  } catch (error) {
    console.error("Error creating bulk notifications:", error)
    throw error
  }
}

// Mark notifications as read for a user
const markNotificationsAsRead = async (userId, notificationIds = null) => {
  try {
    const filter = { recipient: userId, isRead: false }
    if (notificationIds) {
      filter._id = { $in: notificationIds }
    }

    const result = await Notification.updateMany(filter, {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    })

    return result
  } catch (error) {
    console.error("Error marking notifications as read:", error)
    throw error
  }
}

// Clean up old notifications
const cleanupOldNotifications = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      isRead: true,
    })

    console.log(`Cleaned up ${result.deletedCount} old notifications`)
    return result
  } catch (error) {
    console.error("Error cleaning up old notifications:", error)
    throw error
  }
}

// Get notification statistics for a user
const getUserNotificationStats = async (userId) => {
  try {
    const stats = await Notification.aggregate([
      { $match: { recipient: userId } },
      {
        $group: {
          _id: "$type",
          total: { $sum: 1 },
          unread: {
            $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] },
          },
        },
      },
    ])

    const totalNotifications = await Notification.countDocuments({
      recipient: userId,
    })
    const unreadNotifications = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    })

    return {
      totalNotifications,
      unreadNotifications,
      typeBreakdown: stats,
    }
  } catch (error) {
    console.error("Error getting user notification stats:", error)
    throw error
  }
}

module.exports = {
  createNotification,
  createBulkNotifications,
  markNotificationsAsRead,
  cleanupOldNotifications,
  getUserNotificationStats,
  sendNotificationEmail,
}
