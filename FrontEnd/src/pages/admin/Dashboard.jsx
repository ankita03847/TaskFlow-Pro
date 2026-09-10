import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuClipboardList,
  LuClock,
  LuActivity,
  LuCircleCheck,
  LuPlus,
  LuFileSpreadsheet,
  LuCalendar,
  LuSearch,
  LuArrowUpRight,
  LuCircleAlert,
  LuUsers,
} from "react-icons/lu";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import moment from "moment";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { UserContext } from "../../context/userContext";
import useUserAuth from "../../hooks/UseUserAuth";
import axiosInstance from "../../utils/Axiosinstance";
import { API_PATHS } from "../../utils/ApiPath";
import TaskStatusSelector, { normalizeStatus } from "../../components/common/TaskStatusSelector";

// Chart Color Tokens
const STATUS_COLORS = {
  Pending: "#f59e0b", // Amber
  "In Progress": "#3b82f6", // Blue
  Completed: "#10b981", // Emerald
};

const PRIORITY_COLORS = {
  High: "#f43f5e", // Rose
  Medium: "#3b82f6", // Blue
  Low: "#10b981", // Emerald
};

const AdminDashboard = () => {
  useUserAuth();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taskFilter, setTaskFilter] = useState("all");
  const [taskSearch, setTaskSearch] = useState("");

  // Fetch Dashboard Metrics
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_PATHS.TASKS.GET_DASHBOARD_DATA);
      setDashboardData(response.data);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.error("Could not load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // One-click Task Excel Export
  const handleExportTasks = async () => {
    try {
      toast.loading("Generating report...", { id: "export-tasks" });
      const response = await axiosInstance.get(API_PATHS.REPORTS.EXPORT_TASKS, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TaskReport_${moment().format("YYYY-MM-DD")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Tasks Excel report downloaded!", { id: "export-tasks" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to download tasks report", { id: "export-tasks" });
    }
  };

  // Metrics Data Calculations
  const totalTasks = dashboardData?.totalTasks || 0;
  const pendingTasks = dashboardData?.pendingTasks || 0;
  const inProgressTasks = dashboardData?.inProgressTasks || 0;
  const completedTasks = dashboardData?.completedTasks || 0;
  const overdueTasks = dashboardData?.overdueTasks || 0;
  const totalUsers = dashboardData?.totalUsers || 0;

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Chart Data Formatting
  const statusPieData = [
    { name: "Pending", value: pendingTasks, color: STATUS_COLORS.Pending },
    { name: "In Progress", value: inProgressTasks, color: STATUS_COLORS["In Progress"] },
    { name: "Completed", value: completedTasks, color: STATUS_COLORS.Completed },
  ].filter((item) => item.value > 0);

  const priorityBarData = dashboardData?.priorityDistribution?.map((item) => ({
    name: item.priority,
    Tasks: item.count,
    fill: PRIORITY_COLORS[item.priority] || "#3b82f6",
  })) || [
    { name: "High", Tasks: dashboardData?.taskDistributionByPriority?.high || 0, fill: PRIORITY_COLORS.High },
    { name: "Medium", Tasks: dashboardData?.taskDistributionByPriority?.medium || 0, fill: PRIORITY_COLORS.Medium },
    { name: "Low", Tasks: dashboardData?.taskDistributionByPriority?.low || 0, fill: PRIORITY_COLORS.Low },
  ];

  // Handle in-place optimistic status update
  const handleOptimisticStatusChange = (taskId, newStatus, prevStatus) => {
    const normNew = normalizeStatus(newStatus);
    const normPrev = normalizeStatus(prevStatus);

    setDashboardData((prev) => {
      if (!prev) return prev;

      let pending = prev.pendingTasks || 0;
      let inProgress = prev.inProgressTasks || 0;
      let completed = prev.completedTasks || 0;

      if (normPrev === "pending") pending = Math.max(0, pending - 1);
      else if (normPrev === "active") inProgress = Math.max(0, inProgress - 1);
      else if (normPrev === "done") completed = Math.max(0, completed - 1);

      if (normNew === "pending") pending += 1;
      else if (normNew === "active") inProgress += 1;
      else if (normNew === "done") completed += 1;

      const updatedRecent = (prev.recentTasks || []).map((t) =>
        t._id === taskId ? { ...t, status: newStatus } : t
      );

      return {
        ...prev,
        pendingTasks: pending,
        inProgressTasks: inProgress,
        completedTasks: completed,
        recentTasks: updatedRecent,
      };
    });
  };

  const handleStatusRollback = (taskId, prevStatus) => {
    fetchDashboardData();
  };

  // Filtered Recent Tasks
  const recentTasks = dashboardData?.recentTasks || [];
  const filteredRecentTasks = recentTasks.filter((task) => {
    const norm = normalizeStatus(task.status);
    const matchesFilter =
      taskFilter === "all" ||
      norm === taskFilter ||
      (taskFilter === "in-progress" && norm === "active") ||
      (taskFilter === "completed" && norm === "done");
    const matchesSearch =
      !taskSearch ||
      task.title?.toLowerCase().includes(taskSearch.toLowerCase()) ||
      task.description?.toLowerCase().includes(taskSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading && !dashboardData) {
    return (
      <DashboardLayout activeMenu="Dashboard">
        <div className="py-24 text-center text-slate-400 text-sm">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <span>Loading workspace metrics...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="space-y-6">

        {/* 1. Top Executive Productivity Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg">
          {/* Subtle glow circle decoration */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-300 rounded-full border border-blue-400/30">
                  Workspace Overview
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <LuCalendar size={13} />
                  {moment().format("dddd, MMMM D, YYYY")}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Welcome back, {user?.name || "Administrator"}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Your team has completed{" "}
                <span className="text-emerald-400 font-semibold">{completedTasks}</span> of{" "}
                <span className="text-white font-semibold">{totalTasks}</span> assigned tasks.
                Workspace completion velocity is at{" "}
                <span className="text-blue-400 font-semibold">{completionRate}%</span>.
              </p>

              {/* Progress Velocity Bar */}
              <div className="pt-2 max-w-md">
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                  <span>Task Completion Velocity</span>
                  <span>{completionRate}%</span>
                </div>
                <div className="w-full h-2.5 bg-white/15 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 rounded-full transition-all duration-700 shadow-xs"
                    style={{ width: `${completionRate}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Banner Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => navigate("/admin/create-task")}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-blue-600/30 transition-all cursor-pointer hover:scale-[1.02]"
              >
                <LuPlus size={16} className="stroke-[2.5]" />
                <span>Create Task</span>
              </button>

              <button
                onClick={handleExportTasks}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 active:bg-white/20 text-white text-xs sm:text-sm font-medium rounded-xl border border-white/15 backdrop-blur-sm transition-all cursor-pointer"
              >
                <LuFileSpreadsheet size={16} className="text-emerald-400" />
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Smart KPI Metric Cards (Grid of 4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Tasks */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 group hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Total Tasks
              </span>
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 border border-violet-200/60 flex items-center justify-center transition-transform group-hover:scale-110">
                <LuClipboardList size={20} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 tracking-tight">
                {totalTasks}
              </span>
              <span className="text-xs font-medium text-slate-400">across workspace</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 text-violet-600 font-medium">
                <LuUsers size={13} /> {totalUsers} team members
              </span>
              <span>100% total</span>
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 group hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Pending Tasks
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center transition-transform group-hover:scale-110">
                <LuClock size={20} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 tracking-tight">
                {pendingTasks}
              </span>
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                Awaiting
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Requires attention</span>
              <span className="font-semibold text-slate-700">
                {totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 group hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                In Progress
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center transition-transform group-hover:scale-110">
                <LuActivity size={20} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 tracking-tight">
                {inProgressTasks}
              </span>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                Active
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Being handled</span>
              <span className="font-semibold text-slate-700">
                {totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 group hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Completed
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center transition-transform group-hover:scale-110">
                <LuCircleCheck size={20} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 tracking-tight">
                {completedTasks}
              </span>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                Done
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="text-emerald-600 font-semibold">{completionRate}% finished</span>
              {overdueTasks > 0 && (
                <span className="text-rose-500 font-medium flex items-center gap-1">
                  <LuCircleAlert size={12} /> {overdueTasks} overdue
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Analytics Charts Grid: Task Distribution & Priority Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donut Chart: Task Distribution by Status */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Task Distribution by Status
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Proportion of pending, in-progress, and finished tasks
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded-lg">
                Real-Time
              </span>
            </div>

            <div className="h-64 relative flex items-center justify-center">
              {statusPieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke="transparent"
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(val, name) => [`${val} tasks`, name]}
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          color: "#fff",
                          borderRadius: "10px",
                          fontSize: "12px",
                          border: "none",
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center Donut Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
                    <span className="text-2xl font-black text-slate-800 tracking-tight">
                      {completionRate}%
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Done
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 text-xs">
                  <LuClipboardList size={32} className="mb-2 text-slate-300" />
                  <span>No tasks created yet</span>
                </div>
              )}
            </div>
          </div>

          {/* Bar Chart: Task Priority Levels */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Task Priority Breakdown
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Volume of tasks grouped by urgency level
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>High</span>
                <span className="w-2 h-2 rounded-full bg-blue-500 ml-2"></span>
                <span>Medium</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 ml-2"></span>
                <span>Low</span>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "rgba(241, 245, 249, 0.6)" }}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      borderRadius: "10px",
                      fontSize: "12px",
                      border: "none",
                    }}
                  />
                  <Bar dataKey="Tasks" radius={[8, 8, 0, 0]} maxBarSize={48}>
                    {priorityBarData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 4. Interactive Recent Tasks Activity Feed */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Header & Filter Controls */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Recent Tasks
                </h3>
                <span className="text-xs px-2 py-0.5 font-semibold bg-slate-100 text-slate-700 rounded-full">
                  {recentTasks.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitor current deliverables and member assignments
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search Inside Recent Tasks */}
              <div className="relative">
                <LuSearch size={14} className="absolute inset-y-0 left-2.5 my-auto text-slate-400" />
                <input
                  type="text"
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  placeholder="Filter tasks..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center p-1 bg-slate-100/80 rounded-xl text-xs font-semibold text-slate-600">
                <button
                  onClick={() => setTaskFilter("all")}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    taskFilter === "all"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "hover:text-slate-900"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setTaskFilter("pending")}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    taskFilter === "pending"
                      ? "bg-white text-amber-600 shadow-2xs"
                      : "hover:text-slate-900"
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setTaskFilter("in-progress")}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    taskFilter === "in-progress"
                      ? "bg-white text-blue-600 shadow-2xs"
                      : "hover:text-slate-900"
                  }`}
                >
                  In Progress
                </button>
                <button
                  onClick={() => setTaskFilter("completed")}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    taskFilter === "completed"
                      ? "bg-white text-emerald-600 shadow-2xs"
                      : "hover:text-slate-900"
                  }`}
                >
                  Done
                </button>
              </div>

              <button
                onClick={() => navigate("/admin/task")}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                <span>View All</span>
                <LuArrowUpRight size={14} />
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {filteredRecentTasks.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-5">Task Details</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Assignees</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredRecentTasks.map((task) => {
                    const isOverdue =
                      task.dueDate &&
                      new Date(task.dueDate) < new Date() &&
                      task.status !== "completed";

                    // Priority Pill Classes
                    const priorityClass =
                      task.priority === "High"
                        ? "bg-rose-50 text-rose-600 border-rose-200/60"
                        : task.priority === "Medium"
                        ? "bg-blue-50 text-blue-600 border-blue-200/60"
                        : "bg-emerald-50 text-emerald-600 border-emerald-200/60";

                    // Status Pill Classes
                    const statusClass =
                      task.status === "completed"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                        : task.status === "in-progress"
                        ? "bg-blue-50 text-blue-700 border-blue-200/60"
                        : "bg-amber-50 text-amber-700 border-amber-200/60";

                    return (
                      <tr
                        key={task._id}
                        onClick={() => navigate(`/admin/task`)}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      >
                        {/* Title & Description */}
                        <td className="py-3.5 px-5">
                          <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                              {task.description}
                            </p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <TaskStatusSelector
                            taskId={task._id}
                            status={task.status}
                            onStatusChange={handleOptimisticStatusChange}
                            onErrorRollback={handleStatusRollback}
                            size="xs"
                          />
                        </td>

                        {/* Priority */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${priorityClass}`}
                          >
                            {task.priority || "Medium"}
                          </span>
                        </td>

                        {/* Due Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <LuCalendar size={13} className="text-slate-400" />
                            <span className={isOverdue ? "text-rose-600 font-semibold" : ""}>
                              {task.dueDate ? moment(task.dueDate).format("MMM D, YYYY") : "No date"}
                            </span>
                            {isOverdue && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-rose-50 text-rose-600 rounded-md font-bold">
                                Overdue
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Assignees Stacked Avatars */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {task.assignedTo && task.assignedTo.length > 0 ? (
                            <div className="flex items-center -space-x-2">
                              {task.assignedTo.slice(0, 3).map((assignee, idx) => (
                                <div
                                  key={assignee._id || idx}
                                  title={assignee.name || "Member"}
                                  className="w-7 h-7 rounded-full border-2 border-white shadow-2xs overflow-hidden"
                                >
                                  {assignee.profileImageUrl ? (
                                    <img
                                      src={assignee.profileImageUrl}
                                      alt={assignee.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-slate-700 text-white font-bold text-[10px] flex items-center justify-center">
                                      {assignee.name ? assignee.name.charAt(0).toUpperCase() : "M"}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {task.assignedTo.length > 3 && (
                                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 border-2 border-white text-[10px] font-bold flex items-center justify-center">
                                  +{task.assignedTo.length - 3}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Unassigned</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                <LuClipboardList size={36} className="mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600">No matching tasks found</p>
                <p className="text-slate-400 mt-0.5">
                  Try clearing your search or filter options.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;