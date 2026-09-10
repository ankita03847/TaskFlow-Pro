const Task = require("../Models/Task");
const User = require("../Models/User");
const excelJS = require("exceljs");

// ============================================================================
// 1. EXPORT ALL TASKS REPORT (Excel / XLSX)
// ============================================================================
// @desc    Export all tasks as an Excel (.xlsx) file
// @route   GET /api/report/export/tasks OR GET /api/reports/export/tasks
// @access  Private (Admin only)
const exportTasksReport = async (req, res) => {
  try {
    // 1. Fetch all tasks from MongoDB and populate assigned user details
    const tasks = await Task.find().populate("assignedTo", "name email");

    // 2. Create a new Excel workbook and worksheet
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tasks Report");

    // 3. Define the columns (headers and width)
    worksheet.columns = [
      { header: "Task ID", key: "_id", width: 25 },
      { header: "Title", key: "title", width: 30 },
      { header: "Description", key: "description", width: 50 },
      { header: "Priority", key: "priority", width: 15 },
      { header: "Status", key: "status", width: 20 },
      { header: "Due Date", key: "dueDate", width: 20 },
      { header: "Assigned To", key: "assignedTo", width: 30 },
    ];

    // Optional: make header row bold
    worksheet.getRow(1).font = { bold: true };

    // 4. Add each task as a row in the worksheet
    tasks.forEach((task) => {
      const assignedTo =
        task.assignedTo && task.assignedTo.length > 0
          ? task.assignedTo.map((user) => `${user.name} (${user.email})`).join(", ")
          : "Unassigned";

      worksheet.addRow({
        _id: task._id,
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "Medium",
        status: task.status || "pending",
        dueDate: task.dueDate ? task.dueDate.toISOString().split("T")[0] : "",
        assignedTo: assignedTo,
      });
    });

    // 5. Set response headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="tasks_report.xlsx"'
    );

    // 6. Write Excel file directly to response stream
    return workbook.xlsx.write(res).then(() => {
      res.status(200).end();
    });
  } catch (error) {
    console.error("Error exporting tasks:", error);
    res
      .status(500)
      .json({ message: "Error exporting tasks", error: error.message });
  }
};

// ============================================================================
// 2. EXPORT USERS & TASK STATS REPORT (Excel / XLSX)
// ============================================================================
// @desc    Export team members and their task count stats as an Excel (.xlsx) file
// @route   GET /api/report/export/users OR GET /api/reports/export/users
// @access  Private (Admin only)
const exportUsersReport = async (req, res) => {
  try {
    // 1. Fetch non-admin members
    const users = await User.find({ role: { $ne: "admin" } }).select("-password");

    // 2. Create workbook and worksheet
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users Report");

    // 3. Define columns
    worksheet.columns = [
      { header: "User ID", key: "_id", width: 25 },
      { header: "Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Role", key: "role", width: 15 },
      { header: "Total Tasks", key: "totalTasks", width: 15 },
      { header: "Pending Tasks", key: "pendingTasks", width: 15 },
      { header: "In Progress", key: "inProgressTasks", width: 15 },
      { header: "Completed Tasks", key: "completedTasks", width: 18 },
    ];

    worksheet.getRow(1).font = { bold: true };

    // 4. Calculate task statistics per user and add rows
    for (const user of users) {
      const totalTasks = await Task.countDocuments({ assignedTo: user._id });
      const pendingTasks = await Task.countDocuments({ assignedTo: user._id, status: "pending" });
      const inProgressTasks = await Task.countDocuments({ assignedTo: user._id, status: "in-progress" });
      const completedTasks = await Task.countDocuments({ assignedTo: user._id, status: "completed" });

      worksheet.addRow({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
      });
    }

    // 5. Set headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="users_report.xlsx"'
    );

    // 6. Write Excel to response
    return workbook.xlsx.write(res).then(() => {
      res.status(200).end();
    });
  } catch (error) {
    console.error("Error exporting users:", error);
    res
      .status(500)
      .json({ message: "Error exporting users", error: error.message });
  }
};

module.exports = {
  exportTasksReport,
  exportUsersReport,
};