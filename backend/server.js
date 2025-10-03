const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")
const path = require("path")
const { initializeScheduledTasks } = require("./utils/scheduledTasks")
const connectDB = require("./config/database")
const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/users")
const bookingRoutes = require("./routes/bookings"); 
const complaintRoutes = require("./routes/complaints");
dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Database connection
connectDB()

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/bookings", require("./routes/bookings"))
app.use("/api/payments", require("./routes/payments"))
 app.use("/api/complaints", require("./routes/complaints"))
 app.use("/api/notifications", require("./routes/notifications"))
// app.use("/api/admin", require("./routes/admin"))
// app.use("/api/reviews", require("./routes/reviews"))

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large. Maximum size is 5MB.",
    })
  }

  if (err.message && err.message.includes("CV must be a PDF file")) {
    return res.status(400).json({
      success: false,
      message: "CV must be a PDF file",
    })
  }

  if (err.message && err.message.includes("Photo must be an image file")) {
    return res.status(400).json({
      success: false,
      message: "Photo must be an image file",
    })
  }

  res.status(500).json({
    success: false,
    message: "Something went wrong!",
  })
})
 

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)

  initializeScheduledTasks()
})
