const jwt = require("jsonwebtoken");
const User = require("../Models/User");

const protect = async (req, res, next) => {
  let token;

  // 1. Check Authorization header (supports both 'Bearer <token>' and raw '<token>')
  const authHeader = req.headers.authorization;
  if (authHeader) {
    if (authHeader.toLowerCase().startsWith("bearer ")) {
      token = authHeader.slice(7).trim();
    } else {
      token = authHeader.trim();
    }
  }

  // 2. Check alternative headers commonly used in API clients
  if (!token && req.headers["x-auth-token"]) {
    token = String(req.headers["x-auth-token"]).trim();
  }
  if (!token && req.headers["token"]) {
    token = String(req.headers["token"]).trim();
  }

  // 3. Check query param ?token=... (super convenient for quick Postman/browser testing)
  if (!token && req.query && req.query.token) {
    token = String(req.query.token).trim();
  }

  // 4. Dev mode helper: if in local development and ?dev=admin or header x-dev-role: admin is passed
  if (!token && process.env.NODE_ENV !== "production") {
    const devRole = req.query.dev || req.headers["x-dev-role"];
    if (devRole === "admin") {
      const adminUser = await User.findOne({ role: "admin" }).select("-password");
      if (adminUser) {
        req.user = adminUser;
        return next();
      }
    } else if (devRole === "member" || devRole === "user") {
      const memberUser = await User.findOne({ role: { $ne: "admin" } }).select("-password");
      if (memberUser) {
        req.user = memberUser;
        return next();
      }
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }

  try {
    const secret = process.env.JWT_SECRET || process.env.JWT_SECREAT;
    const decoded = jwt.verify(token, secret);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found or account deactivated" });
    }

    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    return res.status(401).json({ message: "Not authorized, token failed: " + error.message });
  }
};

// Middleware for admin only access
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Not authorized as admin" });
  }
};

module.exports = { protect, adminOnly };