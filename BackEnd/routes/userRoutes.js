const express = require("express");
const { protect, adminOnly } = require("../Middlewares/authMiddleware");
const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

const router = express.Router();

// User Management Routes
router.post("/", protect, adminOnly, createUser); // Create new user (Admin only)
router.get("/", protect, adminOnly, getUsers); // Get all users with stats (Admin only)
router.get("/:id", protect, getUserById); // Get specific user (Admin or account owner)
router.put("/:id", protect, adminOnly, updateUser); // Update user info/role (Admin only)
router.delete("/:id", protect, adminOnly, deleteUser); // Delete user (Admin only)

module.exports = router;