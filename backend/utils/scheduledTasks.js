const cron = require("node-cron")
const Booking = require("../models/Booking")
const Notification = require("../models/Notification")
const { cleanupOldNotifications } = require("./notificationService")

// Schedule task to check for expired bookings and send reminders
const scheduleBookingTasks = () => {
  // Run every hour to check for expired bookings
  cron.schedule("0 * * * *", async () => {
    try {
      console.log("Checking for expired bookings...")

      // Find bookings that have expired
      const expiredBookings = await Booking.find({
        status: { $in: ["pending", "confirmed"] },
        expiresAt: { $lt: new Date() },
      }).populate("student", "name email")

      // Update expired bookings
      if (expiredBookings.length > 0) {
        await Booking.updateMany(
          {
            _id: { $in: expiredBookings.map((b) => b._id) },
          },
          { status: "expired" },
        )

        // Create notifications for expired bookings
        const notifications = expiredBookings.map((booking) => ({
          recipient: booking.student._id,
          title: "Booking Expired",
          message: `Your booking for ${booking.language} lesson on ${booking.date.toDateString()} has expired`,
          type: "system",
          priority: "normal",
        }))

        await Notification.insertMany(notifications)

        console.log(`Marked ${expiredBookings.length} bookings as expired`)
      }
    } catch (error) {
      console.error("Error in booking expiration task:", error)
    }
  })

  // Send booking reminders 24 hours before the lesson
  cron.schedule("0 9 * * *", async () => {
    try {
      console.log("Sending booking reminders...")

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)

      const dayAfterTomorrow = new Date(tomorrow)
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

      // Find confirmed bookings for tomorrow
      const upcomingBookings = await Booking.find({
        status: "confirmed",
        date: {
          $gte: tomorrow,
          $lt: dayAfterTomorrow,
        },
      })
        .populate("student", "name email")
        .populate("teacher", "name email")

      // Create reminder notifications
      const notifications = []

      for (const booking of upcomingBookings) {
        // Reminder for student
        notifications.push({
          recipient: booking.student._id,
          title: "Lesson Reminder",
          message: `You have a ${booking.language} lesson tomorrow at ${booking.startTime} with ${booking.teacher.name}`,
          type: "reminder",
          priority: "normal",
          relatedBooking: booking._id,
          channels: {
            inApp: true,
            email: true,
          },
        })

        // Reminder for teacher
        notifications.push({
          recipient: booking.teacher._id,
          title: "Lesson Reminder",
          message: `You have a ${booking.language} lesson tomorrow at ${booking.startTime} with ${booking.student.name}`,
          type: "reminder",
          priority: "normal",
          relatedBooking: booking._id,
          channels: {
            inApp: true,
            email: true,
          },
        })
      }

      if (notifications.length > 0) {
        await Notification.insertMany(notifications)
        console.log(`Sent ${notifications.length} booking reminders`)
      }
    } catch (error) {
      console.error("Error in booking reminder task:", error)
    }
  })
}

// Schedule cleanup tasks
const scheduleCleanupTasks = () => {
  // Clean up old notifications every day at 2 AM
  cron.schedule("0 2 * * *", async () => {
    try {
      console.log("Cleaning up old notifications...")
      await cleanupOldNotifications(30) // Delete notifications older than 30 days
    } catch (error) {
      console.error("Error in notification cleanup task:", error)
    }
  })
}

// Initialize all scheduled tasks
const initializeScheduledTasks = () => {
  console.log("Initializing scheduled tasks...")
  scheduleBookingTasks()
  scheduleCleanupTasks()
  console.log("Scheduled tasks initialized successfully")
}

module.exports = {
  initializeScheduledTasks,
  scheduleBookingTasks,
  scheduleCleanupTasks,
}
