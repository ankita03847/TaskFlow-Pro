const mongoose = require("mongoose");
const Task = require("../Models/Task");
const User = require("../Models/User");

// ============================================================================
// HELPER FUNCTION: Calculate Task Progress Percentage
// ============================================================================
// Calculates the progress (0 to 100%) based on completed items in todoChecklist
const calculateProgress = (checklist) => {
  if (!checklist || checklist.length === 0) return 0;
  const completedCount = checklist.filter((item) => item.completed).length;
  return Math.round((completedCount / checklist.length) * 100);
};

// ============================================================================
// 1. GET ALL TASKS
// ============================================================================
// @desc    Get all tasks with optional filters (Search, Status, Priority)
//          - Admin users see all tasks in the system
//          - Regular members see only tasks assigned to them
// @route   GET /api/task OR GET /api/tasks
// @access  Private (Requires valid JWT token or dev mode)
const getTasks = async (req, res) => {
  try {
    const filter = {};

    // ------------------------------------------------------------------------
    // STEP 1: Determine role-based visibility
    // ------------------------------------------------------------------------
    // Non-admin users can ONLY see tasks assigned to their user ID
    if (req.user.role !== "admin") {
      filter.assignedTo = req.user._id;
    } else if (req.query.assignedTo) {
      // Admin can optionally filter by a specific assigned user ID
      filter.assignedTo = req.query.assignedTo;
    }

    // ------------------------------------------------------------------------
    // STEP 2: Apply query filters (status, priority, search)
    // ------------------------------------------------------------------------
    // Status filter: pending, in-progress/active, completed/done
    if (req.query.status) {
      const s = req.query.status.toString().trim().toLowerCase();
      if (s === "in-progress" || s === "active") {
        filter.status = { $in: ["in-progress", "active"] };
      } else if (s === "completed" || s === "done") {
        filter.status = { $in: ["completed", "done"] };
      } else {
        filter.status = s;
      }
    }

    // Priority filter: High, Medium, Low (case-insensitive)
    if (req.query.priority) {
      const p = req.query.priority.toString().trim().toLowerCase();
      if (p === "high") filter.priority = "High";
      else if (p === "medium") filter.priority = "Medium";
      else if (p === "low") filter.priority = "Low";
      else filter.priority = req.query.priority;
    }

    // Search filter: searches in task title or description
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search.trim(), $options: "i" };
      filter.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    // ------------------------------------------------------------------------
    // STEP 3: Query database and populate user information
    // ------------------------------------------------------------------------
    const tasks = await Task.find(filter)
      .sort({ createdAt: -1 }) // Newest tasks first
      .populate("assignedTo", "name email profileImageUrl role")
      .populate("createdBy", "name email");

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error in getTasks:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ============================================================================
// 2. GET TASK BY ID
// ============================================================================
// @desc    Get details of a single task by its MongoDB _id
//          - Accessible by Admin or members assigned to this task
// @route   GET /api/task/:id
// @access  Private
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    // ------------------------------------------------------------------------
    // STEP 1: Validate MongoDB ObjectId format
    // ------------------------------------------------------------------------
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task ID format" });
    }

    // ------------------------------------------------------------------------
    // STEP 2: Find task and populate user details
    // ------------------------------------------------------------------------
    const task = await Task.findById(id)
      .populate("assignedTo", "name email profileImageUrl role")
      .populate("createdBy", "name email");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // ------------------------------------------------------------------------
    // STEP 3: Verify authorization (Admin or assigned member)
    // ------------------------------------------------------------------------
    const isAssigned = task.assignedTo.some(
      (user) => (user._id || user).toString() === req.user._id.toString()
    );

    if (req.user.role !== "admin" && !isAssigned) {
      return res.status(403).json({ message: "Not authorized to view this task" });
    }

    res.status(200).json(task);
  } catch (error) {
    console.error("Error in getTaskById:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ============================================================================
// 3. CREATE TASK
// ============================================================================
// @desc    Create a new task with checklist and assigned members
// @route   POST /api/task OR POST /api/task/create
// @access  Private (Admin only)
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      attachments,
      todoChecklist,
      todoList,
    } = req.body;

    // ------------------------------------------------------------------------
    // STEP 1: Validate required fields (title, description, dueDate)
    // ------------------------------------------------------------------------
    if (!title || !description || !dueDate) {
      return res.status(400).json({
        message: "Please provide title, description, and dueDate",
      });
    }

    // ------------------------------------------------------------------------
    // STEP 2: Validate and parse dueDate
    // ------------------------------------------------------------------------
    const parsedDueDate = new Date(dueDate);
    if (isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({
        message: "Invalid dueDate format. Please provide a valid date string (e.g. YYYY-MM-DD)",
      });
    }

    // ------------------------------------------------------------------------
    // STEP 3: Normalize priority (High, Medium, Low)
    // ------------------------------------------------------------------------
    let formattedPriority = "Medium";
    if (priority) {
      const p = priority.toString().trim().toLowerCase();
      if (p === "high") formattedPriority = "High";
      else if (p === "low") formattedPriority = "Low";
      else if (p === "medium") formattedPriority = "Medium";
    }

    // ------------------------------------------------------------------------
    // STEP 4: Format assignedTo array
    // Supports:
    //   - Array of ObjectId strings: ["6a9dc...", "6a9dd..."]
    //   - Array of user objects: [{ _id: "6a9dc..." }]
    //   - Single string ID: "6a9dc..."
    //   - Omitted or empty: []
    // ------------------------------------------------------------------------
    let formattedAssignedTo = [];
    if (Array.isArray(assignedTo)) {
      formattedAssignedTo = assignedTo
        .map((item) => (item && typeof item === "object" && item._id ? item._id : item))
        .filter((id) => mongoose.Types.ObjectId.isValid(id));
    } else if (typeof assignedTo === "string" && mongoose.Types.ObjectId.isValid(assignedTo.trim())) {
      formattedAssignedTo = [assignedTo.trim()];
    }

    // ------------------------------------------------------------------------
    // STEP 5: Format checklist items
    // Supports:
    //   - Array of objects: [{ text: "Item 1", completed: false }]
    //   - Array of strings: ["Item 1", "Item 2"]
    // ------------------------------------------------------------------------
    let formattedChecklist = [];
    const rawChecklist = todoChecklist || todoList;
    if (Array.isArray(rawChecklist)) {
      formattedChecklist = rawChecklist
        .map((item) => {
          if (typeof item === "string" && item.trim()) {
            return { text: item.trim(), completed: false };
          } else if (item && typeof item === "object" && item.text) {
            return { text: String(item.text).trim(), completed: Boolean(item.completed) };
          }
          return null;
        })
        .filter(Boolean);
    }

    // ------------------------------------------------------------------------
    // STEP 6: Calculate initial progress based on checklist
    // ------------------------------------------------------------------------
    const progress = calculateProgress(formattedChecklist);

    // ------------------------------------------------------------------------
    // STEP 7: Save task into MongoDB
    // ------------------------------------------------------------------------
    const task = await Task.create({
      title: title.trim(),
      description: description.trim(),
      priority: formattedPriority,
      dueDate: parsedDueDate,
      status: "pending",
      assignedTo: formattedAssignedTo,
      createdBy: req.user._id,
      attachments: Array.isArray(attachments) ? attachments : [],
      todoChecklist: formattedChecklist,
      progress,
    });

    // ------------------------------------------------------------------------
    // STEP 8: Return populated task object with HTTP 201 Created
    // ------------------------------------------------------------------------
    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email profileImageUrl role")
      .populate("createdBy", "name email");

    res.status(201).json(populatedTask);
  } catch (error) {
    console.error("Error in createTask:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ============================================================================
// 4. UPDATE TASK
// ============================================================================
// @desc    Update task details (title, description, priority, dueDate, etc.)
// @route   PUT /api/task/:id
// @access  Private (Admin or assigned member)
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;

    // ------------------------------------------------------------------------
    // STEP 1: Validate task ID
    // ------------------------------------------------------------------------
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task ID format" });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // ------------------------------------------------------------------------
    // STEP 2: Verify authorization (Admin or assigned member)
    // ------------------------------------------------------------------------
    const isAssigned = task.assignedTo.some(
      (userId) => userId.toString() === req.user._id.toString()
    );

    if (req.user.role !== "admin" && !isAssigned) {
      return res.status(403).json({ message: "Not authorized to update this task" });
    }

    // ------------------------------------------------------------------------
    // STEP 3: Apply fields to update if provided
    // ------------------------------------------------------------------------
    const {
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      attachments,
      todoChecklist,
      status,
    } = req.body;

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();

    // Normalize priority
    if (priority !== undefined) {
      const p = priority.toString().trim().toLowerCase();
      if (p === "high") task.priority = "High";
      else if (p === "low") task.priority = "Low";
      else if (p === "medium") task.priority = "Medium";
      else task.priority = priority;
    }

    // Normalize dueDate
    if (dueDate !== undefined) {
      const parsedDueDate = new Date(dueDate);
      if (!isNaN(parsedDueDate.getTime())) {
        task.dueDate = parsedDueDate;
      }
    }

    // Only admin can reassign tasks to different members
    if (assignedTo !== undefined && req.user.role === "admin") {
      if (Array.isArray(assignedTo)) {
        task.assignedTo = assignedTo
          .map((item) => (item && typeof item === "object" && item._id ? item._id : item))
          .filter((uid) => mongoose.Types.ObjectId.isValid(uid));
      } else if (typeof assignedTo === "string" && mongoose.Types.ObjectId.isValid(assignedTo.trim())) {
        task.assignedTo = [assignedTo.trim()];
      }
    }

    // Attachments
    if (attachments !== undefined) {
      task.attachments = Array.isArray(attachments) ? attachments : [];
    }

    // Checklist update
    if (todoChecklist !== undefined && Array.isArray(todoChecklist)) {
      task.todoChecklist = todoChecklist
        .map((item) => {
          if (typeof item === "string" && item.trim()) {
            return { text: item.trim(), completed: false };
          } else if (item && typeof item === "object" && item.text) {
            return { text: String(item.text).trim(), completed: Boolean(item.completed) };
          }
          return null;
        })
        .filter(Boolean);
      task.progress = calculateProgress(task.todoChecklist);
    }

    // Status update
    if (status !== undefined) {
      const s = status.toString().trim().toLowerCase();
      const allowed = ["pending", "in-progress", "completed"];
      if (allowed.includes(s)) {
        task.status = s;
        if (s === "completed") {
          task.progress = 100;
        }
      }
    }

    // ------------------------------------------------------------------------
    // STEP 4: Save updated task to DB
    // ------------------------------------------------------------------------
    const updatedTask = await task.save();

    const populatedTask = await Task.findById(updatedTask._id)
      .populate("assignedTo", "name email profileImageUrl role")
      .populate("createdBy", "name email");

    res.status(200).json(populatedTask);
  } catch (error) {
    console.error("Error in updateTask:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ============================================================================
// 5. DELETE TASK
// ============================================================================
// @desc    Permanently delete a task by ID
// @route   DELETE /api/task/:id
// @access  Private (Admin only)
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    // ------------------------------------------------------------------------
    // STEP 1: Validate task ID
    // ------------------------------------------------------------------------
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task ID format" });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // ------------------------------------------------------------------------
    // STEP 2: Delete from database
    // ------------------------------------------------------------------------
    await Task.findByIdAndDelete(id);

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error in deleteTask:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ============================================================================
// 6. UPDATE TASK STATUS
// ============================================================================
// @desc    Update only the status of a task (pending, in-progress, completed)
//          - When set to 'completed', progress automatically becomes 100%
// @route   PUT /api/task/:id/status
// @access  Private (Admin or assigned member)
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    let { status } = req.body;

    // ------------------------------------------------------------------------
    // STEP 1: Validate ID and status value
    // ------------------------------------------------------------------------
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task ID format" });
    }

    if (!status || typeof status !== "string") {
      return res.status(400).json({
        message: "Please provide a valid status string (pending, in-progress, or completed)",
      });
    }

    status = status.trim().toLowerCase().replace(/\s+/g, "-");
    const allowedStatuses = ["pending", "in-progress", "completed"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: `Status must be one of: ${allowedStatuses.join(", ")}`,
      });
    }

    // ------------------------------------------------------------------------
    // STEP 2: Find task and check permissions
    // ------------------------------------------------------------------------
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const isAssigned = task.assignedTo.some(
      (userId) => userId.toString() === req.user._id.toString()
    );

    if (req.user.role !== "admin" && !isAssigned) {
      return res.status(403).json({ message: "Not authorized to update status of this task" });
    }

    // ------------------------------------------------------------------------
    // STEP 3: Update status and sync progress/checklist
    // ------------------------------------------------------------------------
    task.status = status;

    if (status === "completed") {
      task.progress = 100;
      // Mark all checklist items as completed
      if (task.todoChecklist && task.todoChecklist.length > 0) {
        task.todoChecklist.forEach((item) => (item.completed = true));
      }
    } else if (status === "pending" && task.progress === 100) {
      task.progress = 0;
    }

    const updatedTask = await task.save();

    const populatedTask = await Task.findById(updatedTask._id)
      .populate("assignedTo", "name email profileImageUrl role")
      .populate("createdBy", "name email");

    res.status(200).json(populatedTask);
  } catch (error) {
    console.error("Error in updateTaskStatus:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ============================================================================
// 6B. PATCH TASK STATUS (Direct in-place status update)
// ============================================================================
// @desc    Update only the status of a task ("pending", "active", "done")
//          - Validates status is one of: "pending", "active", "done"
//          - Returns 400 if status is invalid
//          - Syncs progress (100% on done, 0% on pending from 100%)
// @route   PATCH /api/task/:id OR PATCH /api/tasks/:id
// @access  Private (Admin or assigned member)
const patchTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    let { status } = req.body;

    // STEP 1: Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task ID format" });
    }

    // STEP 2: Validate status presence & value
    if (!status || typeof status !== "string") {
      return res.status(400).json({
        message: "Status is required and must be one of: pending, active, done",
      });
    }

    const rawStatus = status.trim().toLowerCase();
    const validStatuses = ["pending", "active", "done"];

    if (!validStatuses.includes(rawStatus)) {
      return res.status(400).json({
        message: "Status must be one of: pending, active, done",
      });
    }

    // STEP 3: Find task and check permissions
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const isAssigned = task.assignedTo.some(
      (userId) => userId.toString() === req.user._id.toString()
    );

    if (req.user.role !== "admin" && !isAssigned) {
      return res.status(403).json({ message: "Not authorized to update status of this task" });
    }

    // STEP 4: Apply status and sync progress/checklist
    task.status = rawStatus;

    if (rawStatus === "done") {
      task.progress = 100;
      if (task.todoChecklist && task.todoChecklist.length > 0) {
        task.todoChecklist.forEach((item) => (item.completed = true));
      }
    } else if (rawStatus === "pending" && task.progress === 100) {
      task.progress = 0;
    }

    const updatedTask = await task.save();

    const populatedTask = await Task.findById(updatedTask._id)
      .populate("assignedTo", "name email profileImageUrl role")
      .populate("createdBy", "name email");

    res.status(200).json(populatedTask);
  } catch (error) {
    console.error("Error in patchTaskStatus:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ============================================================================
// 7. UPDATE TASK CHECKLIST (TODOS)
// ============================================================================
// @desc    Manage checklist items for a task:
//          Option A: Replace full checklist array -> { todoChecklist: [...] }
//          Option B: Add a new checklist item     -> { text: "new item", action: "add" }
//          Option C: Toggle a single item         -> { todoId: "...", completed: true }
// @route   PUT /api/task/:id/todo OR PUT /api/task/:id/checklist
// @access  Private (Admin or assigned member)
const updateTaskChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const { todoChecklist, todoList, todoId, completed, text, action } = req.body;
    const rawChecklist = todoChecklist || todoList;

    // ------------------------------------------------------------------------
    // STEP 1: Validate task ID
    // ------------------------------------------------------------------------
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task ID format" });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // ------------------------------------------------------------------------
    // STEP 2: Verify authorization (Admin or assigned member)
    // ------------------------------------------------------------------------
    const isAssigned = task.assignedTo.some(
      (userId) => userId.toString() === req.user._id.toString()
    );

    if (req.user.role !== "admin" && !isAssigned) {
      return res.status(403).json({ message: "Not authorized to update checklist of this task" });
    }

    // ------------------------------------------------------------------------
    // STEP 3: Execute the requested checklist operation
    // ------------------------------------------------------------------------
    // OPTION A: Full checklist replacement
    if (Array.isArray(rawChecklist)) {
      task.todoChecklist = rawChecklist
        .map((item) => {
          if (typeof item === "string" && item.trim()) {
            return { text: item.trim(), completed: false };
          } else if (item && typeof item === "object" && item.text) {
            return { text: String(item.text).trim(), completed: Boolean(item.completed) };
          }
          return null;
        })
        .filter(Boolean);
    }
    // OPTION B: Add a single new checklist item
    else if (action === "add" || (text && !todoId)) {
      if (!text || !String(text).trim()) {
        return res.status(400).json({ message: "Text is required to add a checklist item" });
      }
      task.todoChecklist.push({ text: String(text).trim(), completed: false });
    }
    // OPTION C: Toggle an existing checklist item by todoId
    else if (todoId) {
      const todoItem = task.todoChecklist.id(todoId);
      if (!todoItem) {
        return res.status(404).json({ message: "Todo checklist item not found" });
      }
      todoItem.completed = completed !== undefined ? Boolean(completed) : !todoItem.completed;
    } else {
      return res.status(400).json({
        message: "Provide either todoChecklist array, todoId to toggle, or text to add item",
      });
    }

    // ------------------------------------------------------------------------
    // STEP 4: Recalculate progress percentage and update status
    // ------------------------------------------------------------------------
    task.progress = calculateProgress(task.todoChecklist);

    if (task.progress === 100 && task.todoChecklist.length > 0) {
      task.status = "completed";
    } else if (task.progress > 0 && task.status === "pending") {
      task.status = "in-progress";
    }

    const updatedTask = await task.save();

    const populatedTask = await Task.findById(updatedTask._id)
      .populate("assignedTo", "name email profileImageUrl role")
      .populate("createdBy", "name email");

    res.status(200).json(populatedTask);
  } catch (error) {
    console.error("Error in updateTaskChecklist:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ============================================================================
// 8. GET ADMIN DASHBOARD DATA
// ============================================================================
// @desc    Get complete system statistics for Admin:
//          - Total tasks, pending, in-progress, completed, overdue
//          - Task distribution by status
//          - Task distribution by priority (High, Medium, Low)
//          - Total registered non-admin users
//          - 10 most recent tasks
// @route   GET /api/task/dashboard-data
// @access  Private (Admin only)
const getDashboardData = async (req, res) => {
  try {
    // ------------------------------------------------------------------------
    // STEP 1: Calculate task counts by status
    // ------------------------------------------------------------------------
    const totalTasks = await Task.countDocuments();
    const pendingTasks = await Task.countDocuments({ status: "pending" });
    const inProgressTasks = await Task.countDocuments({ status: { $in: ["in-progress", "active"] } });
    const completedTasks = await Task.countDocuments({ status: { $in: ["completed", "done"] } });

    // ------------------------------------------------------------------------
    // STEP 2: Calculate overdue tasks (dueDate in past and not yet completed)
    // ------------------------------------------------------------------------
    const overdueTasks = await Task.countDocuments({
      dueDate: { $lt: new Date() },
      status: { $nin: ["completed", "done"] },
    });

    // ------------------------------------------------------------------------
    // STEP 3: Calculate task distribution by priority
    // ------------------------------------------------------------------------
    const highPriority = await Task.countDocuments({ priority: "High" });
    const mediumPriority = await Task.countDocuments({ priority: "Medium" });
    const lowPriority = await Task.countDocuments({ priority: "Low" });

    // ------------------------------------------------------------------------
    // STEP 4: Total non-admin team members
    // ------------------------------------------------------------------------
    const totalUsers = await User.countDocuments({ role: { $ne: "admin" } });

    // ------------------------------------------------------------------------
    // STEP 5: Fetch 10 most recent tasks in the system
    // ------------------------------------------------------------------------
    const recentTasks = await Task.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("assignedTo", "name email profileImageUrl role")
      .populate("createdBy", "name email");

    // ------------------------------------------------------------------------
    // STEP 6: Return structured dashboard metrics
    // ------------------------------------------------------------------------
    res.status(200).json({
      success: true,
      message: "Admin dashboard data fetched successfully",
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      totalUsers,
      // Task Distribution by Status
      taskDistributionByStatus: {
        pending: pendingTasks,
        "in-progress": inProgressTasks,
        completed: completedTasks,
      },
      statusDistribution: [
        { status: "Pending", count: pendingTasks },
        { status: "In Progress", count: inProgressTasks },
        { status: "Completed", count: completedTasks },
      ],
      // Task Distribution by Priority
      taskDistributionByPriority: {
        high: highPriority,
        medium: mediumPriority,
        low: lowPriority,
      },
      priorityDistribution: [
        { priority: "High", count: highPriority },
        { priority: "Medium", count: mediumPriority },
        { priority: "Low", count: lowPriority },
      ],
      priorities: {
        high: highPriority,
        medium: mediumPriority,
        low: lowPriority,
      },
      // 10 Recent Tasks
      recentTasks,
    });
  } catch (error) {
    console.error("Error in getDashboardData:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ============================================================================
// 9. GET USER DASHBOARD DATA
// ============================================================================
// @desc    Get personal task statistics for the currently logged-in user:
//          - Total assigned tasks, pending, in-progress, completed, overdue
//          - Task distribution by status (for this user)
//          - Task distribution by priority (for this user)
//          - 10 most recent tasks assigned to this user
// @route   GET /api/task/user-dashboard-data
// @access  Private (Logged-in user)
const getUserDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;

    // ------------------------------------------------------------------------
    // STEP 1: Calculate task counts for this user by status
    // ------------------------------------------------------------------------
    const totalTasks = await Task.countDocuments({ assignedTo: userId });
    const pendingTasks = await Task.countDocuments({
      assignedTo: userId,
      status: "pending",
    });
    const inProgressTasks = await Task.countDocuments({
      assignedTo: userId,
      status: { $in: ["in-progress", "active"] },
    });
    const completedTasks = await Task.countDocuments({
      assignedTo: userId,
      status: { $in: ["completed", "done"] },
    });

    // ------------------------------------------------------------------------
    // STEP 2: Calculate overdue tasks for this user
    // ------------------------------------------------------------------------
    const overdueTasks = await Task.countDocuments({
      assignedTo: userId,
      dueDate: { $lt: new Date() },
      status: { $nin: ["completed", "done"] },
    });

    // ------------------------------------------------------------------------
    // STEP 3: Calculate task distribution by priority for this user
    // ------------------------------------------------------------------------
    const highPriority = await Task.countDocuments({
      assignedTo: userId,
      priority: "High",
    });
    const mediumPriority = await Task.countDocuments({
      assignedTo: userId,
      priority: "Medium",
    });
    const lowPriority = await Task.countDocuments({
      assignedTo: userId,
      priority: "Low",
    });

    // ------------------------------------------------------------------------
    // STEP 4: Fetch 10 most recent tasks assigned to this user
    // ------------------------------------------------------------------------
    const recentTasks = await Task.find({ assignedTo: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("assignedTo", "name email profileImageUrl role")
      .populate("createdBy", "name email");

    // ------------------------------------------------------------------------
    // STEP 5: Return structured dashboard metrics
    // ------------------------------------------------------------------------
    res.status(200).json({
      success: true,
      message: "User dashboard data fetched successfully",
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      // Task Distribution by Status for logged-in user
      taskDistributionByStatus: {
        pending: pendingTasks,
        "in-progress": inProgressTasks,
        completed: completedTasks,
      },
      statusDistribution: [
        { status: "Pending", count: pendingTasks },
        { status: "In Progress", count: inProgressTasks },
        { status: "Completed", count: completedTasks },
      ],
      // Task Distribution by Priority for logged-in user
      taskDistributionByPriority: {
        high: highPriority,
        medium: mediumPriority,
        low: lowPriority,
      },
      priorityDistribution: [
        { priority: "High", count: highPriority },
        { priority: "Medium", count: mediumPriority },
        { priority: "Low", count: lowPriority },
      ],
      priorities: {
        high: highPriority,
        medium: mediumPriority,
        low: lowPriority,
      },
      // 10 Recent Tasks assigned to this user
      recentTasks,
    });
  } catch (error) {
    console.error("Error in getUserDashboardData:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ============================================================================
// MODULE EXPORTS
// ============================================================================
module.exports = {
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
};
