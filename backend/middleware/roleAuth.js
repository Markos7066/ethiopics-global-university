// Role-based authorization middleware
const roleAuth = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated (should be set by auth middleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Access denied. No user found.",
        })
      }

      // Check if user role is in allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
        })
      }

      next()
    } catch (error) {
      console.error("Role authorization error:", error)
      res.status(500).json({
        success: false,
        message: "Server error during authorization",
      })
    }
  }
}

module.exports = roleAuth
