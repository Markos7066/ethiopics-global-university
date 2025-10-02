// middleware/upload.js
const multer = require("multer");

// Use memory storage to keep files in buffer (no local save)
const storage = multer.memoryStorage();

// File filter (unchanged, adapted for memory storage)
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "cv") {
    // Allow PDF files for CV
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("CV must be a PDF file"), false);
    }
  } else if (file.fieldname === "photo") {
    // Allow image files for photo
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Photo must be an image file"), false);
    }
  } else if (file.fieldname === "attachment") {
    // Allow various file types for complaint attachments
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"), false);
    }
  } else {
    cb(new Error("Unexpected field"), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Export different upload configurations
module.exports = {
  // For teacher registration (CV + photo)
  teacherRegistration: upload.fields([
    { name: "cv", maxCount: 1 },
    { name: "photo", maxCount: 1 },
  ]),

  // For single file uploads
  single: (fieldname) => upload.single(fieldname),

  // For complaint attachments
  complaintAttachment: upload.single("attachment"),

  // For multiple files
  multiple: (fieldname, maxCount) => upload.array(fieldname, maxCount),
};