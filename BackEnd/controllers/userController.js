const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Task = require("../Models/Task");
const User = require("../Models/User");

// @desc    Create a new user (Admin only)
// @route   POST /api/user (or /api/users)
// @access  Private (Admin only)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, profileImageUrl } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: role && ["admin", "member", "user"].includes(role) ? role : "member",
      profileImageUrl: profileImageUrl || "",
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImageUrl: user.profileImageUrl,
      message: "User created successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all users (excluding admins) with task count stats
// @route   GET /api/user (or /api/users)
// @access  Private (Admin only)
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } }).select("-password");

    // Add task counts to each user
    const usersWithTaskCounts = await Promise.all(
      users.map(async (user) => {
        const pendingTasks = await Task.countDocuments({
          assignedTo: user._id,          status: { $regex: /^pending$/i },
        });
        const inProgressTasks = await Task.countDocuments({
          assignedTo: user._id,
          status: { $regex: /^(in[- ]?progress|active)$/i },
        });
        const completedTasks = await Task.countDocuments({
          assignedTo: user._id,
          status: { $regex: /^(completed|done)$/i },
        });

        return {
          ...user._doc,
          pendingTasks,
          inProgressTasks,
          completedTasks,
          totalTasks: pendingTasks + inProgressTasks + completedTasks,
        };
      })
    );

    res.json(usersWithTaskCounts);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/user/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only allow admin or the user themselves to view their full profile
    if (req.user.role !== "admin" && req.user._id.toString() !== id) {
      return res.status(403).json({ message: "Not authorized to view this user profile" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update user details or role (Admin only)
// @route   PUT /api/user/:id
// @access  Private (Admin only)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, email, role } = req.body;

    if (name) user.name = name;
    if (email) user.email = email;
    if (role && ["member", "user", "admin"].includes(role)) {
      user.role = role;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      profileImageUrl: updatedUser.profileImageUrl,
      role: updatedUser.role,
      message: "User updated successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete a user (Admin only)
// @route   DELETE /api/user/:id
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot delete an admin account" });
    }

    if (req.user._id.toString() === id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    // Remove user assignment from tasks
    await Task.updateMany(
      { assignedTo: user._id },
      { $pull: { assignedTo: user._id } }
    );

    await User.findByIdAndDelete(id);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { createUser, getUsers, getUserById, updateUser, deleteUser };