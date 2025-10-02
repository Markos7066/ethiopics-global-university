// utils/emailTemplates.js

// Welcome Email Template
const welcomeEmail = (name) => ({
  subject: `Welcome to Language Teaching Center, ${name}!`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #007bff;">Welcome, ${name}!</h2>
      <p>Thank you for joining the Language Teaching Center. We're excited to have you as part of our community.</p>
      <ul style="list-style-type: disc; padding-left: 20px;">
        <li><strong>Students:</strong> Explore teachers and book sessions.</li>
        <li><strong>Teachers:</strong> Your account is pending approval—stay tuned!</li>
      </ul>
      <p>If you have any questions, feel free to reply to this email.</p>
      <hr style="border: none; border-top: 1px solid #ccc;">
      <p style="color: #666; font-size: 12px;">Best,<br>Language Teaching Center Team</p>
    </div>
  `,
});

// Password Reset Template
const passwordResetEmail = (name, resetUrl) => ({
  subject: `Reset Your Password - Language Teaching Center`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #007bff;">Password Reset Request</h2>
      <p>Hello ${name},</p>
      <p>You requested a password reset. Click the button below to set a new password (expires in 10 minutes):</p>
      <a href="${resetUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
      <p>If you didn’t request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #ccc;">
      <p style="color: #666; font-size: 12px;">Best,<br>Language Teaching Center Team</p>
    </div>
  `,
});

// Teacher Approval Template
const teacherApprovalEmail = (teacherName) => ({
  subject: `Your Teacher Account is Approved! - Language Teaching Center`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #28a745;">Congratulations, ${teacherName}!</h2>
      <p>Your teacher account has been approved. You can now start accepting student bookings.</p>
      <p><strong>Next Steps:</strong> Login to your dashboard to manage your schedule and bookings.</p>
      <a href="http://localhost:3000/teachers" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Your Profile</a>
      <hr style="border: none; border-top: 1px solid #ccc;">
      <p style="color: #666; font-size: 12px;">Best,<br>Language Teaching Center Team</p>
    </div>
  `,
});

// Teacher Rejection Template
const teacherRejectionEmail = (teacherName, reason) => ({
  subject: `Update on Your Teacher Application - Language Teaching Center`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #dc3545;">Application Update, ${teacherName}</h2>
      <p>Thank you for applying to teach with us. Unfortunately, your application was not approved at this time.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>Feel free to reapply after addressing the feedback. We’re here to assist!</p>
      <hr style="border: none; border-top: 1px solid #ccc;">
      <p style="color: #666; font-size: 12px;">Best,<br>Language Teaching Center Team</p>
    </div>
  `,
});

// Booking Confirmation Template
const bookingConfirmationEmail = (studentName, teacherName, date, time) => ({
  subject: `Booking Confirmed - Language Teaching Center`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #007bff;">Booking Confirmed</h2>
      <p>Dear ${studentName},</p>
      <p>Your booking with ${teacherName} has been confirmed for ${date} at ${time}.</p>
      <p>Please complete the payment to secure your booking.</p>
      <hr style="border: none; border-top: 1px solid #ccc;">
      <p style="color: #666; font-size: 12px;">Best,<br>Language Teaching Center Team</p>
    </div>
  `,
});

// Payment Received Template
const paymentReceivedEmail = (studentName, amount, bookingDetails) => ({
  subject: `Payment Received - Language Teaching Center`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #28a745;">Payment Confirmed</h2>
      <p>Dear ${studentName},</p>
      <p>We have received your payment of $${amount} for your booking.</p>
      <p><strong>Booking Details:</strong> ${bookingDetails}</p>
      <hr style="border: none; border-top: 1px solid #ccc;">
      <p style="color: #666; font-size: 12px;">Best,<br>Language Teaching Center Team</p>
    </div>
  `,
});

// New Teacher Registration Notification Template
const teacherRegistrationNotification = (firstName, lastName, email) => ({
  subject: `New Teacher Registration - Language Teaching Center`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #007bff;">New Teacher Registration</h2>
      <p>A new teacher (${firstName} ${lastName}, Email: ${email}) has registered and is awaiting your approval.</p>
      <p><strong>Action Required:</strong> Please review and approve or reject the application via the admin dashboard.</p>
      <hr style="border: none; border-top: 1px solid #ccc;">
      <p style="color: #666; font-size: 12px;">Best,<br>Language Teaching Center Team</p>
    </div>
  `,
});

module.exports = {
  welcomeEmail,
  passwordResetEmail,
  teacherApprovalEmail,
  teacherRejectionEmail,
  bookingConfirmationEmail,
  paymentReceivedEmail,
  teacherRegistrationNotification, // Add this export
};