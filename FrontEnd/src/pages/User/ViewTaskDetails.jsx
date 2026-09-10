import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  LuArrowLeft,
  LuCalendar,
  LuUsers,
  LuListTodo,
  LuCheck,
  LuLoaderCircle,
  LuSave,
} from "react-icons/lu";
import moment from "moment";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { UserContext } from "../../context/userContext";
import useUserAuth from "../../hooks/UseUserAuth";
import axiosInstance from "../../utils/Axiosinstance";
import { API_PATHS } from "../../utils/ApiPath";
import { normalizeStatus } from "../../components/common/TaskStatusSelector";

const ViewTaskDetails = () => {
  useUserAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(UserContext);

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const isAdminRoute =
    location.pathname.startsWith("/admin") || user?.role === "admin";

  // Fetch Task Details
  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_PATHS.TASKS.GET_TASK_BY_ID(id));
      setTask(response.data);
      setSelectedStatus(normalizeStatus(response.data.status));
    } catch (err) {
      console.error("Failed to load task details:", err);
      toast.error("Could not load task details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchTaskDetails();
  }, [id]);

  // Save Status & Redirect to Manager Task
  const handleSaveStatus = async () => {
    try {
      setUpdatingStatus(true);
      await axiosInstance.patch(API_PATHS.TASKS.PATCH_TASK_STATUS(id), {
        status: selectedStatus,
      });
      toast.success("Task status saved successfully!");
      if (isAdminRoute) {
        navigate("/admin/task");
      } else {
        navigate("/user/myTask");
      }
    } catch (err) {
      console.error("Failed to save status:", err);
      toast.error(err.response?.data?.message || "Failed to save status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Toggle Todo Checklist Item
  const handleToggleTodo = async (todoId, currentCompleted) => {
    try {
      const response = await axiosInstance.put(
        API_PATHS.TASKS.UPDATE_TODO_CHECKLIST(id),
        {
          todoId,
          completed: !currentCompleted,
        }
      );
      setTask(response.data);
      toast.success(
        !currentCompleted ? "Subtask marked complete!" : "Subtask unchecked"
      );
    } catch (err) {
      console.error("Failed to update subtask:", err);
      toast.error("Could not update subtask");
    }
  };

  if (loading) {
    return (
      <DashboardLayout activeMenu="My Tasks">
        <div className="py-24 text-center text-slate-400 text-sm">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <span>Loading task details...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!task) {
    return (
      <DashboardLayout activeMenu="My Tasks">
        <div className="p-8 text-center text-slate-400">
          <p>Task not found or you are not authorized to view it.</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
          >
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const completedTodos = task.todoChecklist?.filter((i) => i.completed).length || 0;
  const totalTodos = task.todoChecklist?.length || 0;

  return (
    <DashboardLayout activeMenu={isAdminRoute ? "Manage Tasks" : "My Tasks"}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Back Button & Top Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(isAdminRoute ? "/admin/task" : "/user/myTask")}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LuArrowLeft size={16} />
            <span>{isAdminRoute ? "Back to Manage Tasks" : "Back to My Tasks"}</span>
          </button>
        </div>

        {/* Main Task Detail Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          
          {/* Header Area */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                    task.priority === "High"
                      ? "bg-rose-50 text-rose-600 border border-rose-200/60"
                      : task.priority === "Medium"
                      ? "bg-blue-50 text-blue-600 border border-blue-200/60"
                      : "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
                  }`}
                >
                  {task.priority || "Medium"} Priority
                </span>

                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <LuCalendar size={13} />
                  Due: {task.dueDate ? moment(task.dueDate).format("MMM D, YYYY") : "No date"}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {task.title}
              </h1>
            </div>

            {/* Interactive Status Changer & Save Button */}
            <div className="flex flex-col items-start sm:items-end gap-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Task Status
              </span>
              <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                {[
                  { label: "Pending", value: "pending" },
                  { label: "Active", value: "active" },
                  { label: "Done", value: "done" },
                ].map((s) => {
                  const isSelected = selectedStatus === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => setSelectedStatus(s.value)}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        isSelected
                          ? s.value === "done"
                            ? "bg-emerald-600 text-white shadow-2xs font-bold"
                            : s.value === "active"
                            ? "bg-blue-600 text-white shadow-2xs font-bold"
                            : "bg-amber-500 text-white shadow-2xs font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>

              {/* Save Status & Redirect Button */}
              <button
                type="button"
                disabled={updatingStatus}
                onClick={handleSaveStatus}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {updatingStatus ? (
                  <LuLoaderCircle size={14} className="animate-spin" />
                ) : (
                  <LuSave size={14} className="stroke-[2.5]" />
                )}
                <span>{updatingStatus ? "Saving..." : "Save Status & Return"}</span>
              </button>
            </div>
          </div>

          {/* Description Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Description
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              {task.description || "No description provided."}
            </p>
          </div>

          {/* Checklist Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <LuListTodo size={14} className="text-blue-600" />
                <span>Subtask Checklist ({completedTodos} of {totalTodos} completed)</span>
              </h3>
              <span className="text-xs font-bold text-blue-600">{task.progress || 0}%</span>
            </div>

            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${task.progress || 0}%` }}
              ></div>
            </div>

            {/* Checklist Items Interactive List */}
            {task.todoChecklist && task.todoChecklist.length > 0 ? (
              <div className="space-y-2">
                {task.todoChecklist.map((todo) => (
                  <div
                    key={todo._id}
                    onClick={() => handleToggleTodo(todo._id, todo.completed)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      todo.completed
                        ? "bg-emerald-50/50 border-emerald-200 text-slate-500"
                        : "bg-white border-slate-200/80 hover:border-slate-300 text-slate-800"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        todo.completed
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {todo.completed && <LuCheck size={13} className="stroke-[3]" />}
                    </div>

                    <span
                      className={`text-xs sm:text-sm font-medium ${
                        todo.completed ? "line-through text-slate-400" : ""
                      }`}
                    >
                      {todo.text}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                No checklist steps assigned for this task.
              </p>
            )}
          </div>

          {/* Assigned Team Members */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <LuUsers size={14} className="text-blue-600" />
              <span>Assigned Team</span>
            </h3>

            {task.assignedTo && task.assignedTo.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {task.assignedTo.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {member.profileImageUrl ? (
                      <img
                        src={member.profileImageUrl}
                        alt={member.name}
                        className="w-6 h-6 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-700 text-white text-[9px] font-bold flex items-center justify-center">
                        {member.name ? member.name.charAt(0).toUpperCase() : "M"}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-slate-800">
                      {member.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No assigned members.</p>
            )}
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};

export default ViewTaskDetails;