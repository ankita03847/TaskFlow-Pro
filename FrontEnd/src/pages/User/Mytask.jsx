import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuListTodo,
  LuSearch,
  LuCalendar,
  LuArrowUpRight,
  LuCircleAlert,
} from "react-icons/lu";
import moment from "moment";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import useUserAuth from "../../hooks/UseUserAuth";
import axiosInstance from "../../utils/Axiosinstance";
import { API_PATHS } from "../../utils/ApiPath";
import TaskStatusSelector, { normalizeStatus } from "../../components/common/TaskStatusSelector";

const MyTask = () => {
  useUserAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS);
      const data = response.data?.tasks || response.data;
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load tasks:", err);
      toast.error("Could not load your assigned tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, []);

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

  const filteredTasks = tasks.filter((task) => {
    const norm = normalizeStatus(task.status);
    const matchesStatus =
      statusFilter === "all" ||
      norm === statusFilter ||
      (statusFilter === "in-progress" && norm === "active") ||
      (statusFilter === "completed" && norm === "done");
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <DashboardLayout activeMenu="My Tasks">
      <div className="space-y-6">

        {/* 1. Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            My Assigned Tasks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View details, update progress, and check off completed items
          </p>
        </div>

        {/* 2. Filter Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { label: "All Tasks", value: "all" },
              { label: "Pending", value: "pending" },
              { label: "In Progress", value: "in-progress" },
              { label: "Completed", value: "completed" },
            ].map((tab) => {
              const isActive = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-blue-50 text-blue-600 border border-blue-200/80 font-bold shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-64">
            <LuSearch size={14} className="absolute inset-y-0 left-2.5 my-auto text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter your tasks..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* 3. Task Cards Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span>Loading your tasks...</span>
          </div>
        ) : filteredTasks.length > 0 ? (
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
                  onClick={() => navigate(`/user/task-details/${task._id}`)}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    {/* Priority & Status */}
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

                    {/* Title */}
                    <h3 className="font-bold text-slate-900 text-sm tracking-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {task.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {task.description || "No description provided."}
                    </p>

                    {/* Subtasks Progress */}
                    {totalTodos > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                          <span>Checklist</span>
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

                  {/* Due Date & Open link */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <LuCalendar size={13} className="text-slate-400" />
                      <span className={isOverdue ? "text-rose-600 font-bold" : ""}>
                        {task.dueDate ? moment(task.dueDate).format("MMM D") : "No due date"}
                      </span>
                      {isOverdue && <LuCircleAlert size={12} className="text-rose-600" />}
                    </div>

                    <span className="inline-flex items-center gap-0.5 text-blue-600 font-semibold group-hover:underline">
                      <span>View</span>
                      <LuArrowUpRight size={13} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
            <LuListTodo size={40} className="mx-auto mb-3 text-slate-300" />
            <h3 className="font-bold text-slate-700 text-base">No tasks found</h3>
            <p className="text-xs text-slate-400 mt-1">
              You are all caught up on deliverables for this filter.
            </p>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default MyTask;