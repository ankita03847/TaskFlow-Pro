import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuPlus,
  LuSearch,
  LuTrash2,
  LuCalendar,
  LuClipboardList,
  LuLayoutGrid,
  LuList,
  LuCircleAlert,
} from "react-icons/lu";
import moment from "moment";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import useUserAuth from "../../hooks/UseUserAuth";
import axiosInstance from "../../utils/Axiosinstance";
import { API_PATHS } from "../../utils/ApiPath";
import TaskStatusSelector, { normalizeStatus } from "../../components/common/TaskStatusSelector";

const ManagerTask = () => {
  useUserAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

  // Fetch all tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS);
      const data = response.data?.tasks || response.data;
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      toast.error("Could not load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Delete Task
  const handleDeleteTask = async (taskId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this task?")) {
      return;
    }

    try {
      await axiosInstance.delete(API_PATHS.TASKS.DELETE_TASK(taskId));
      toast.success("Task deleted successfully");
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      console.error("Failed to delete task:", err);
      toast.error("Could not delete task");
    }
  };

  // Handle in-place optimistic status update
  const handleOptimisticStatusChange = (taskId, newStatus, prevStatus) => {
    setTasks((prev) =>
      prev.map((t) =>
        t._id === taskId
          ? {
              ...t,
              status: newStatus,
              progress:
                newStatus === "done"
                  ? 100
                  : newStatus === "pending" && t.progress === 100
                  ? 0
                  : t.progress,
            }
          : t
      )
    );
  };

  const handleStatusRollback = (taskId, prevStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: prevStatus } : t))
    );
  };

  // Filter Tasks
  const filteredTasks = tasks.filter((task) => {
    const norm = normalizeStatus(task.status);
    const matchesStatus =
      statusFilter === "all" ||
      norm === statusFilter ||
      (statusFilter === "in-progress" && norm === "active") ||
      (statusFilter === "completed" && norm === "done");
    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const getStatusCount = (statusKey) => {
    if (statusKey === "all") return tasks.length;
    return tasks.filter((t) => {
      const norm = normalizeStatus(t.status);
      if (statusKey === "pending") return norm === "pending";
      if (statusKey === "in-progress" || statusKey === "active") return norm === "active";
      if (statusKey === "completed" || statusKey === "done") return norm === "done";
      return false;
    }).length;
  };

  return (
    <DashboardLayout activeMenu="Manage Tasks">
      <div className="space-y-6">

        {/* 1. Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Manage Tasks
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Organize, track progress, and supervise team deliverables
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-slate-100 text-blue-600"
                    : "text-slate-400 hover:text-slate-700"
                }`}
                title="Grid View"
              >
                <LuLayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "list"
                    ? "bg-slate-100 text-blue-600"
                    : "text-slate-400 hover:text-slate-700"
                }`}
                title="List View"
              >
                <LuList size={16} />
              </button>
            </div>

            {/* Create Task Button */}
            <button
              onClick={() => navigate("/admin/create-task")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs shadow-blue-600/25 transition-all cursor-pointer"
            >
              <LuPlus size={16} className="stroke-[2.5]" />
              <span>Create Task</span>
            </button>
          </div>
        </div>

        {/* 2. Filter Bar (Search + Status Tabs + Priority Dropdown) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { label: "All Tasks", value: "all" },
              { label: "Pending", value: "pending" },
              { label: "In Progress", value: "in-progress" },
              { label: "Completed", value: "completed" },
            ].map((tab) => {
              const isActive = statusFilter === tab.value;
              const count = getStatusCount(tab.value);
              return (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-blue-50 text-blue-600 border border-blue-200/80 shadow-2xs font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Priority Controls */}
          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 md:w-56">
              <LuSearch size={14} className="absolute inset-y-0 left-2.5 my-auto text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
            </div>

            {/* Priority Filter */}
            <div className="relative shrink-0">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Tasks Presentation: Grid or List */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span>Loading workspace tasks...</span>
          </div>
        ) : filteredTasks.length > 0 ? (
          viewMode === "grid" ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTasks.map((task) => {
                const isOverdue =
                  task.dueDate &&
                  new Date(task.dueDate) < new Date() &&
                  task.status !== "completed";

                const completedTodos =
                  task.todoChecklist?.filter((i) => i.completed).length || 0;
                const totalTodos = task.todoChecklist?.length || 0;

                return (
                  <div
                    key={task._id}
                    onClick={() => navigate(`/admin/task-details/${task._id}`)}
                    className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      {/* Top Badges (Priority & Status) */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                            task.priority === "High"
                              ? "bg-rose-50 text-rose-600 border border-rose-200/60"
                              : task.priority === "Medium"
                              ? "bg-blue-50 text-blue-600 border border-blue-200/60"
                              : "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
                          }`}
                        >
                          {task.priority || "Medium"}
                        </span>

                        <TaskStatusSelector
                          taskId={task._id}
                          status={task.status}
                          onStatusChange={handleOptimisticStatusChange}
                          onErrorRollback={handleStatusRollback}
                        />
                      </div>

                      {/* Title & Description */}
                      <h3 className="font-bold text-slate-900 text-sm tracking-tight line-clamp-2">
                        {task.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {task.description || "No description provided."}
                      </p>

                      {/* Checklist Progress Bar */}
                      {totalTodos > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                            <span>Subtasks</span>
                            <span>
                              {completedTodos} / {totalTodos} ({task.progress || 0}%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all"
                              style={{ width: `${task.progress || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Metadata & Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      {/* Due date */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <LuCalendar size={13} className="text-slate-400" />
                        <span className={isOverdue ? "text-rose-600 font-bold" : ""}>
                          {task.dueDate ? moment(task.dueDate).format("MMM D") : "No date"}
                        </span>
                        {isOverdue && <LuCircleAlert size={12} className="text-rose-600" />}
                      </div>

                      {/* Assignees & Delete button */}
                      <div className="flex items-center gap-2">
                        {task.assignedTo && task.assignedTo.length > 0 && (
                          <div className="flex items-center -space-x-2">
                            {task.assignedTo.slice(0, 2).map((u, i) => (
                              <div
                                key={u._id || i}
                                title={u.name}
                                className="w-6 h-6 rounded-full border border-white shadow-2xs overflow-hidden"
                              >
                                {u.profileImageUrl ? (
                                  <img
                                    src={u.profileImageUrl}
                                    alt={u.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-slate-700 text-white font-bold text-[9px] flex items-center justify-center">
                                    {u.name ? u.name.charAt(0).toUpperCase() : "M"}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <button
                          onClick={(e) => handleDeleteTask(task._id, e)}
                          title="Delete Task"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <LuTrash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <th className="py-3 px-5">Title</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Progress</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredTasks.map((task) => (
                    <tr
                      key={task._id}
                      onClick={() => navigate(`/admin/task-details/${task._id}`)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-5 font-semibold text-slate-900 max-w-xs truncate">
                        {task.title}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <TaskStatusSelector
                          taskId={task._id}
                          status={task.status}
                          onStatusChange={handleOptimisticStatusChange}
                          onErrorRollback={handleStatusRollback}
                          size="xs"
                        />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-semibold">
                        {task.priority}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {task.dueDate ? moment(task.dueDate).format("MMM D, YYYY") : "No date"}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-blue-600">{task.progress || 0}%</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => handleDeleteTask(task._id, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <LuTrash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
            <LuClipboardList size={40} className="mx-auto mb-3 text-slate-300" />
            <h3 className="font-bold text-slate-700 text-base">No tasks match your criteria</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your status filter, priority, or search keywords.
            </p>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default ManagerTask;