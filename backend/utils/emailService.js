// utils/emailService.js
const nodemailer = require("nodemailer");
const templates = require("./emailTemplates"); // Import the updated templates
require("dotenv").config(); // Load environment variables

// Create reusable transporter (configurable via .env)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com", // Default to Gmail
  port: process.env.EMAIL_PORT || 587, // Default to 587 (TLS)
  secure: process.env.EMAIL_PORT === "465", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter on startup (optional, logs readiness)
transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter error:", error);
  } else {
    console.log("Email transporter ready");
  }
});

// Generic send function (exported for direct use in routes)
const sendEmail = async (to, subject, html, text = "") => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
    text, // Optional plain-text fallback
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Specific email functions
const sendWelcomeEmail = async (email, name) => {
  const { subject, html } = templates.welcomeEmail(name);
  return await sendEmail(email, subject, html);
};

const sendPasswordResetEmail = async (email, resetUrl, name) => {
  const { subject, html } = templates.passwordResetEmail(name, resetUrl);
  return await sendEmail(email, subject, html);
};

const sendTeacherApprovalEmail = async (email, teacherName) => {
  const { subject, html } = templates.teacherApprovalEmail(teacherName);
  return await sendEmail(email, subject, html);
};

const sendTeacherRejectionEmail = async (email, teacherName, reason) => {
  const { subject, html } = templates.teacherRejectionEmail(teacherName, reason);
  return await sendEmail(email, subject, html);
};

const sendBookingConfirmationEmail = async (email, studentName, teacherName, date, time) => {
  const { subject, html } = templates.bookingConfirmationEmail(studentName, teacherName, date, time);
  return await sendEmail(email, subject, html);
};

const sendPaymentReceivedEmail = async (email, studentName, amount, bookingDetails) => {
  const { subject, html } = templates.paymentReceivedEmail(studentName, amount, bookingDetails);
  return await sendEmail(email, subject, html);
};

// New function for teacher registration notification
const sendTeacherRegistrationNotification = async (to, user) => {
  const { subject, html } = templates.teacherRegistrationNotification(user.firstname, user.lastname, user.email);
  return await sendEmail(to, subject, html);
};

module.exports = {
  sendEmail, // Add this export for direct use in routes
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendTeacherApprovalEmail,
  sendTeacherRejectionEmail,
  sendBookingConfirmationEmail,
  sendPaymentReceivedEmail,
  sendTeacherRegistrationNotification,
};