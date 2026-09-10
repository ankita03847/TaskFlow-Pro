const express = require("express");
const { protect, adminOnly } = require("../Middlewares/authMiddleware");
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  patchTaskStatus,
  updateTaskChecklist,
  getDashboardData,
  getUserDashboardData,
} = require("../controllers/taskController");

const router = express.Router();

// ============================================================================
// TASK ROUTES - Mapped directly to the Postman "Tasks" Collection
// ============================================================================

// ----------------------------------------------------------------------------
// 1. DASHBOARD ANALYTICS ROUTES (Must be placed before /:id)
// ----------------------------------------------------------------------------

// @route   GET /api/task/dashboard-data
// @desc    Get overall system stats, status distribution, priority distribution, and recent 10 tasks
// @access  Private (Admin only)
router.get("/dashboard-data", protect, adminOnly, getDashboardData);

// @route   GET /api/task/user-dashboard-data
// @desc    Get personal stats for logged-in user, status distribution, priority distribution, and recent 10 tasks
// @access  Private (Logged-in User)
router.get("/user-dashboard-data", protect, getUserDashboardData);

// ----------------------------------------------------------------------------
// 2. TASK CRUD & MANAGEMENT ROUTES
// ----------------------------------------------------------------------------

// @route   GET /api/task OR GET /api/tasks
// @desc    Get all tasks (Admin sees all; Members see tasks assigned to them)
//          Supports query filters: ?status=...&priority=...&search=...&assignedTo=...
// @access  Private
router.get("/", protect, getTasks);

// @route   GET /api/task/:id
// @desc    Get single task details by ID (Admin or assigned member)
// @access  Private
router.get("/:id", protect, getTaskById);

// @route   POST /api/task OR POST /api/task/create
// @desc    Create a new task with title, description, priority, dueDate, checklist, and assignees
// @access  Private (Admin only)
router.post("/", protect, adminOnly, createTask);
router.post("/create", protect, adminOnly, createTask); // Postman alias

// @route   PUT /api/task/:id
// @desc    Update task details (title, description, priority, dueDate, attachments, etc.)
// @access  Private (Admin or assigned member)
router.put("/:id", protect, updateTask);

// @route   DELETE /api/task/:id
// @desc    Delete a task permanently
// @access  Private (Admin only)
router.delete("/:id", protect, adminOnly, deleteTask);

// ----------------------------------------------------------------------------
// 3. TASK STATUS & CHECKLIST SPECIFIC UPDATES
// ----------------------------------------------------------------------------

// @route   PUT /api/task/:id/status
// @desc    Update only the status (pending, in-progress, completed)
//          Automatically synchronizes progress percentage
// @access  Private (Admin or assigned member)
router.put("/:id/status", protect, updateTaskStatus);

// @route   PATCH /api/task/:id OR PATCH /api/tasks/:id
// @desc    Update task status in-place ("pending", "active", "done")
// @access  Private (Admin or assigned member)
router.patch("/:id", protect, patchTaskStatus);
router.patch("/:id/status", protect, patchTaskStatus);

// @route   PUT /api/task/:id/todo OR PUT /api/task/:id/checklist
// @desc    Update checklist items:
//          - Replace entire checklist array: { todoChecklist: [...] }
//          - Add a single item:              { action: "add", text: "..." }
//          - Toggle single item completion:  { todoId: "...", completed: true/false }
// @access  Private (Admin or assigned member)
router.put("/:id/todo", protect, updateTaskChecklist);
router.put("/:id/checklist", protect, updateTaskChecklist); // Convenient alias

module.exports = router;
