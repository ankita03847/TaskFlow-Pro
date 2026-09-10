import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuClipboardList,
  LuClock,
  LuActivity,
  LuCircleCheck,
  LuCalendar,
  LuArrowUpRight,
  LuCircleAlert,
  LuSquareCheck,
} from "react-icons/lu";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import moment from "moment";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { UserContext } from "../../context/userContext";
import useUserAuth from "../../hooks/UseUserAuth";
import axiosInstance from "../../utils/Axiosinstance";
import { API_PATHS } from "../../utils/ApiPath";
import TaskStatusSelector, { normalizeStatus } from "../../components/common/TaskStatusSelector";

const STATUS_COLORS = {
  Pending: "#f59e0b",
  "In Progress": "#3b82f6",
  Completed: "#10b981",
};

const UserDashboard = () => {
  useUserAuth();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch Member Dashboard Data
  const fetchUserDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_PATHS.TASKS.GET_USER_DASHBOARD_DATA);
      setDashboardData(response.data);
    } catch (error) {
      console.error("Failed to load user dashboard data:", error);
      toast.error("Could not load your task statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDashboardData();
  }, []);

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
    fetchUserDashboardData();
  };

  // Metrics
  const totalTasks = dashboardData?.totalTasks || 0;
  const pendingTasks = dashboardData?.pendingTasks || 0;
  const inProgressTasks = dashboardData?.inProgressTasks || 0;
  const completedTasks = dashboardData?.completedTasks || 0;
  const overdueTasks = dashboardData?.overdueTasks || 0;

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const statusPieData = [
    { name: "Pending", value: pendingTasks, color: STATUS_COLORS.Pending },
    { name: "In Progress", value: inProgressTasks, color: STATUS_COLORS["In Progress"] },
    { name: "Completed", value: completedTasks, color: STATUS_COLORS.Completed },
  ].filter((item) => item.value > 0);

  const recentTasks = dashboardData?.recentTasks || [];

  if (loading && !dashboardData) {
    return (
      <DashboardLayout activeMenu="Dashboard">
        <div className="py-24 text-center text-slate-400 text-sm">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <span>Loading your task dashboard...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="space-y-6">

        {/* 1. Member Welcome Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-400/30">
                  Team Member Workspace
                </span>
                {overdueTasks > 0 && (
                  <span className="px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase bg-rose-500/20 text-rose-300 rounded-full border border-rose-400/30 flex items-center gap-1">
                    <LuCircleAlert size={12} />
                    {overdueTasks} Overdue
                  </span>
                )}
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <LuCalendar size={13} />
                  {moment().format("dddd, MMMM D, YYYY")}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Welcome back, {user?.name || "Member"}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                You have completed{" "}
                <span className="text-emerald-400 font-semibold">{completedTasks}</span> of your{" "}
                <span className="text-white font-semibold">{totalTasks}</span> assigned deliverables.
                Your personal completion velocity is{" "}
                <span className="text-blue-400 font-semibold">{completionRate}%</span>.
              </p>

              {/* Progress Velocity Bar */}
              <div className="pt-2 max-w-md">
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                  <span>My Deliverables Progress</span>
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

            {/* Quick action button */}
            <div className="shrink-0">
              <button
                onClick={() => navigate("/user/myTask")}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-blue-600/30 transition-all cursor-pointer hover:scale-[1.02]"
              >
                <LuSquareCheck size={16} />
                <span>Go to My Tasks</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Personal KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* My Tasks */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all group hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                My Total Tasks
              </span>
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 border border-violet-200/60 flex items-center justify-center transition-transform group-hover:scale-110">
                <LuClipboardList size={20} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 tracking-tight">
                {totalTasks}
              </span>
              <span className="text-xs font-medium text-slate-400">assigned to me</span>
            </div>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all group hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Pending Action
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
                Not Started
              </span>
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all group hover:-translate-y-0.5">
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
                Working on
              </span>
            </div>
          </div>

          {/* Completed */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all group hover:-translate-y-0.5">
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
          </div>
        </div>

        {/* 3. Analytics & Workload Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Donut Chart */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs lg:col-span-1">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-1">
              Workload Completion
            </h3>
            <p className="text-xs text-slate-500 mb-4">Ratio of your assigned tasks</p>

            <div className="h-56 relative flex items-center justify-center">
              {statusPieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
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
                      <Legend verticalAlign="bottom" height={32} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
                    <span className="text-xl font-bold text-slate-800">{completionRate}%</span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Done</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 text-xs">
                  <LuClipboardList size={30} className="mb-2 text-slate-300" />
                  <span>No tasks assigned to you</span>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Tasks Feed */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-2 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  My Active Tasks
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tasks assigned directly to your account
                </p>
              </div>

              <button
                onClick={() => navigate("/user/myTask")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                <span>View My Tasks</span>
                <LuArrowUpRight size={14} />
              </button>
            </div>

            <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
              {recentTasks.length > 0 ? (
                recentTasks.slice(0, 5).map((task) => {
                  const isOverdue =
                    task.dueDate &&
                    new Date(task.dueDate) < new Date() &&
                    task.status !== "completed";

                  return (
                    <div
                      key={task._id}
                      onClick={() => navigate(`/user/task-details/${task._id}`)}
                      className="p-4 hover:bg-slate-50/70 transition-colors cursor-pointer flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate hover:text-blue-600">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span
                            className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                              task.priority === "High"
                                ? "bg-rose-50 text-rose-600"
                                : task.priority === "Medium"
                                ? "bg-blue-50 text-blue-600"
                                : "bg-emerald-50 text-emerald-600"
                            }`}
                          >
                            {task.priority}
                          </span>
                          <span>•</span>
                          <span className={isOverdue ? "text-rose-600 font-semibold flex items-center gap-1" : ""}>
                            {task.dueDate ? moment(task.dueDate).format("MMM D") : "No due date"}
                            {isOverdue && <LuCircleAlert size={11} />}
                          </span>
                        </div>
                      </div>

                      <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                        <TaskStatusSelector
                          taskId={task._id}
                          status={task.status}
                          onStatusChange={handleOptimisticStatusChange}
                          onErrorRollback={handleStatusRollback}
                          size="xs"
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <LuSquareCheck size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-600">All caught up!</p>
                  <p className="text-slate-400 mt-0.5">
                    No active tasks currently assigned to you.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;