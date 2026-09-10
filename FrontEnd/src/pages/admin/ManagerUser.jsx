import React, { useState, useEffect } from "react";
import {
  LuUsers,
  LuSearch,
  LuFileSpreadsheet,
  LuTrash2,
  LuMail,
  LuCircleCheck,
  LuClock,
  LuActivity,
  LuClipboardList,
  LuChevronDown,
  LuChevronUp,
  LuCalendar,
  LuLoaderCircle,
} from "react-icons/lu";
import moment from "moment";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import useUserAuth from "../../hooks/UseUserAuth";
import axiosInstance from "../../utils/Axiosinstance";
import { API_PATHS } from "../../utils/ApiPath";
import TaskStatusSelector, { normalizeStatus } from "../../components/common/TaskStatusSelector";

const ManagerUser = () => {
  useUserAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMemberId, setExpandedMemberId] = useState(null);
  const [memberTasksMap, setMemberTasksMap] = useState({});
  const [loadingTasksMap, setLoadingTasksMap] = useState({});

  // Fetch all users with task count stats
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to load users:", err);
      toast.error("Could not load team members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Toggle expanding a member's assigned tasks
  const toggleMemberTasks = async (memberId) => {
    if (expandedMemberId === memberId) {
      setExpandedMemberId(null);
      return;
    }
    setExpandedMemberId(memberId);

    if (!memberTasksMap[memberId]) {
      try {
        setLoadingTasksMap((prev) => ({ ...prev, [memberId]: true }));
        const res = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS, {
          params: { assignedTo: memberId },
        });
        const data = res.data?.tasks || res.data;
        setMemberTasksMap((prev) => ({
          ...prev,
          [memberId]: Array.isArray(data) ? data : [],
        }));
      } catch (err) {
        console.error("Failed to load member tasks:", err);
        toast.error("Could not load tasks for this member");
      } finally {
        setLoadingTasksMap((prev) => ({ ...prev, [memberId]: false }));
      }
    }
  };

  // Optimistic status update for per-member task card
  const handleMemberTaskStatusChange = (memberId, taskId, newStatus, prevStatus) => {
    const normNew = normalizeStatus(newStatus);
    const normPrev = normalizeStatus(prevStatus);

    // 1. Update task card inside memberTasksMap
    setMemberTasksMap((prev) => ({
      ...prev,
      [memberId]: (prev[memberId] || []).map((t) =>
        t._id === taskId ? { ...t, status: newStatus } : t
      ),
    }));

    // 2. Update member card counters optimistically
    setUsers((prev) =>
      prev.map((user) => {
        if (user._id !== memberId) return user;

        let pending = user.pendingTasks || 0;
        let inProgress = user.inProgressTasks || 0;
        let completed = user.completedTasks || 0;

        if (normPrev === "pending") pending = Math.max(0, pending - 1);
        else if (normPrev === "active") inProgress = Math.max(0, inProgress - 1);
        else if (normPrev === "done") completed = Math.max(0, completed - 1);

        if (normNew === "pending") pending += 1;
        else if (normNew === "active") inProgress += 1;
        else if (normNew === "done") completed += 1;

        return {
          ...user,
          pendingTasks: pending,
          inProgressTasks: inProgress,
          completedTasks: completed,
        };
      })
    );
  };

  const handleMemberTaskStatusRollback = (memberId, taskId, prevStatus) => {
    fetchUsers();
    setMemberTasksMap((prev) => ({
      ...prev,
      [memberId]: (prev[memberId] || []).map((t) =>
        t._id === taskId ? { ...t, status: prevStatus } : t
      ),
    }));
  };

  // Delete User
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to remove this team member?")) {
      return;
    }

    try {
      await axiosInstance.delete(API_PATHS.USERS.DELETE_USER(userId));
      toast.success("Team member removed successfully");
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      console.error("Failed to delete user:", err);
      const msg = err.response?.data?.message || "Could not delete user";
      toast.error(msg);
    }
  };

  // Export Users Report
  const handleExportUsers = async () => {
    try {
      toast.loading("Generating users report...", { id: "export-users" });
      const response = await axiosInstance.get(API_PATHS.REPORTS.EXPORT_USERS, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `UserReport_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Users Excel report downloaded!", { id: "export-users" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to download users report", { id: "export-users" });
    }
  };

  // Filter Users
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout activeMenu="Team Members">
      <div className="space-y-6">

        {/* 1. Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Team Members
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage member assignments, workload, and performance
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportUsers}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <LuFileSpreadsheet size={16} className="text-blue-600" />
              <span>Export Users Report</span>
            </button>
          </div>
        </div>

        {/* 2. Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <LuSearch size={15} className="absolute inset-y-0 left-3 my-auto text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team members by name or email..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
          </div>

          <span className="text-xs font-semibold text-slate-500">
            Showing <span className="text-slate-900 font-bold">{filteredUsers.length}</span> members
          </span>
        </div>

        {/* 3. Member Cards Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span>Loading team members...</span>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredUsers.map((member) => {
              const pending = member.pendingTasks || 0;
              const inProgress = member.inProgressTasks || 0;
              const completed = member.completedTasks || 0;
              const total = member.totalTasks || pending + inProgress + completed;
              const userVelocity = total > 0 ? Math.round((completed / total) * 100) : 0;

              return (
                <div
                  key={member._id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Avatar, Name & Delete */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative">
                          {member.profileImageUrl ? (
                            <img
                              src={member.profileImageUrl}
                              alt={member.name}
                              className="w-11 h-11 rounded-full object-cover border-2 border-slate-100"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                              {member.name ? member.name.charAt(0).toUpperCase() : "M"}
                            </div>
                          )}
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 text-sm truncate leading-tight">
                            {member.name}
                          </h3>
                          <p className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1">
                            <LuMail size={12} />
                            {member.email}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteUser(member._id)}
                        title="Remove member"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        <LuTrash2 size={15} />
                      </button>
                    </div>

                    {/* Role Chip */}
                    <div className="mt-3">
                      <span className="inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 text-slate-700 capitalize">
                        {member.role || "member"}
                      </span>
                    </div>

                    {/* Workload Stats Grid */}
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-amber-50/70 border border-amber-200/50 rounded-xl">
                        <span className="text-[10px] font-bold text-amber-600 uppercase flex items-center justify-center gap-1">
                          <LuClock size={11} /> Pending
                        </span>
                        <p className="text-base font-bold text-amber-900 mt-0.5">{pending}</p>
                      </div>

                      <div className="p-2 bg-blue-50/70 border border-blue-200/50 rounded-xl">
                        <span className="text-[10px] font-bold text-blue-600 uppercase flex items-center justify-center gap-1">
                          <LuActivity size={11} /> Active
                        </span>
                        <p className="text-base font-bold text-blue-900 mt-0.5">{inProgress}</p>
                      </div>

                      <div className="p-2 bg-emerald-50/70 border border-emerald-200/50 rounded-xl">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase flex items-center justify-center gap-1">
                          <LuCircleCheck size={11} /> Done
                        </span>
                        <p className="text-base font-bold text-emerald-900 mt-0.5">{completed}</p>
                      </div>
                    </div>
                  </div>

                  {/* Completion Rate Progress */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                      <span>Total Tasks: {total}</span>
                      <span className="text-blue-600 font-bold">{userVelocity}% Done</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${userVelocity}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Expandable Assigned Tasks Button */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => toggleMemberTasks(member._id)}
                      className="w-full flex items-center justify-between py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 text-xs font-semibold text-slate-700 transition-colors cursor-pointer border border-slate-200/60"
                    >
                      <span className="flex items-center gap-1.5">
                        <LuClipboardList size={14} className="text-blue-600" />
                        <span>Assigned Tasks ({total})</span>
                      </span>
                      {expandedMemberId === member._id ? (
                        <LuChevronUp size={14} className="text-slate-400" />
                      ) : (
                        <LuChevronDown size={14} className="text-slate-400" />
                      )}
                    </button>
                  </div>

                  {/* Expandable Tasks Container */}
                  {expandedMemberId === member._id && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {loadingTasksMap[member._id] ? (
                        <div className="py-6 text-center text-xs text-slate-400">
                          <LuLoaderCircle size={18} className="animate-spin text-blue-600 mx-auto mb-1.5" />
                          <span>Loading member tasks...</span>
                        </div>
                      ) : memberTasksMap[member._id]?.length > 0 ? (
                        memberTasksMap[member._id].map((task) => (
                          <div
                            key={task._id}
                            className="p-3 bg-slate-50/80 border border-slate-200/70 rounded-xl flex flex-col gap-2 hover:border-slate-300 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-bold text-slate-900 line-clamp-1 leading-tight">
                                {task.title}
                              </h4>
                              <TaskStatusSelector
                                taskId={task._id}
                                status={task.status}
                                onStatusChange={(taskId, newStatus, prevStatus) =>
                                  handleMemberTaskStatusChange(member._id, taskId, newStatus, prevStatus)
                                }
                                onErrorRollback={(taskId, prevStatus) =>
                                  handleMemberTaskStatusRollback(member._id, taskId, prevStatus)
                                }
                                size="xs"
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span
                                className={`px-1.5 py-0.2 rounded font-semibold ${
                                  task.priority === "High"
                                    ? "bg-rose-50 text-rose-600"
                                    : task.priority === "Medium"
                                    ? "bg-blue-50 text-blue-600"
                                    : "bg-emerald-50 text-emerald-600"
                                }`}
                              >
                                {task.priority || "Medium"}
                              </span>
                              <span className="flex items-center gap-1">
                                <LuCalendar size={11} />
                                {task.dueDate ? moment(task.dueDate).format("MMM D") : "No due date"}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-4 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                          <span>No tasks assigned to this member</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
            <LuUsers size={40} className="mx-auto mb-3 text-slate-300" />
            <h3 className="font-bold text-slate-700 text-base">No team members found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No registered members match your search criteria.
            </p>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default ManagerUser;