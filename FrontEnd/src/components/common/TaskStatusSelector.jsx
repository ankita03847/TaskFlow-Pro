import React, { useState, useEffect } from "react";
import { LuLoaderCircle, LuCheck, LuChevronDown } from "react-icons/lu";
import toast from "react-hot-toast";
import axiosInstance from "../../utils/Axiosinstance";
import { API_PATHS } from "../../utils/ApiPath";

// Normalize various status representations to "pending" | "active" | "done"
export const normalizeStatus = (status) => {
  if (!status) return "pending";
  const s = status.toString().trim().toLowerCase().replace(/\s+/g, "-");
  if (s === "done" || s === "completed") return "done";
  if (s === "active" || s === "in-progress") return "active";
  return "pending";
};

const STATUS_STYLES = {
  pending: {
    badge: "bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100/70",
    dot: "bg-amber-500",
    label: "Pending",
  },
  active: {
    badge: "bg-blue-50 text-blue-700 border-blue-200/80 hover:bg-blue-100/70",
    dot: "bg-blue-500",
    label: "Active",
  },
  done: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/70",
    dot: "bg-emerald-500",
    label: "Done",
  },
};

const TaskStatusSelector = ({
  taskId,
  status,
  onStatusChange,
  onErrorRollback,
  className = "",
  size = "sm",
  disabled = false,
}) => {
  const [currentStatus, setCurrentStatus] = useState(normalizeStatus(status));
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Sync internal state if prop updates externally
  useEffect(() => {
    setCurrentStatus(normalizeStatus(status));
  }, [status]);

  const handleStatusSelect = async (e) => {
    e.stopPropagation();
    const newStatus = e.target.value;
    if (!newStatus || newStatus === currentStatus || loading || disabled) return;

    const previousStatus = currentStatus;

    // 1. Optimistic Update (instant UI feedback)
    setCurrentStatus(newStatus);
    if (typeof onStatusChange === "function") {
      onStatusChange(taskId, newStatus, previousStatus);
    }

    // 2. Call backend PATCH endpoint
    setLoading(true);
    setShowSuccess(false);

    try {
      await axiosInstance.patch(API_PATHS.TASKS.PATCH_TASK_STATUS(taskId), {
        status: newStatus,
      });

      // 3. Success indicator
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
      toast.success(
        `Task status updated to ${STATUS_STYLES[newStatus]?.label || newStatus}`,
        { id: `status-${taskId}` }
      );
    } catch (err) {
      console.error("Failed to patch task status:", err);
      // 4. Rollback on failure
      setCurrentStatus(previousStatus);
      if (typeof onErrorRollback === "function") {
        onErrorRollback(taskId, previousStatus);
      }
      const errorMsg =
        err.response?.data?.message ||
        "Could not update task status. Please try again.";
      toast.error(errorMsg, { id: `status-${taskId}` });
    } finally {
      setLoading(false);
    }
  };

  const styleConfig = STATUS_STYLES[currentStatus] || STATUS_STYLES.pending;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`relative inline-flex items-center gap-1.5 rounded-full font-semibold border transition-all select-none group ${
        size === "xs"
          ? "px-2 py-0.5 text-[10px]"
          : size === "md"
          ? "px-3 py-1 text-xs"
          : "px-2.5 py-0.5 text-[11px]"
      } ${styleConfig.badge} ${
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer shadow-2xs"
      } ${className}`}
      title="Click to change status"
    >
      {/* Icon / Status Dot / Spinner / Checkmark */}
      {loading ? (
        <LuLoaderCircle size={12} className="animate-spin text-current shrink-0" />
      ) : showSuccess ? (
        <LuCheck size={12} className="text-emerald-600 stroke-[3] shrink-0" />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styleConfig.dot}`} />
      )}

      {/* Status Label */}
      <span className="capitalize font-semibold tracking-tight">
        {styleConfig.label}
      </span>

      {/* Dropdown Chevron */}
      {!loading && !showSuccess && (
        <LuChevronDown
          size={11}
          className="text-current opacity-60 group-hover:opacity-100 transition-opacity shrink-0 -mr-0.5"
        />
      )}

      {/* Native invisible select for robust, cross-platform dropdown */}
      <select
        value={currentStatus}
        disabled={loading || disabled}
        onChange={handleStatusSelect}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed bg-transparent"
        aria-label="Change task status"
      >
        <option value="pending" className="text-slate-800 bg-white font-medium">
          Pending
        </option>
        <option value="active" className="text-slate-800 bg-white font-medium">
          Active (In Progress)
        </option>
        <option value="done" className="text-slate-800 bg-white font-medium">
          Done (Completed)
        </option>
      </select>
    </div>
  );
};

export default TaskStatusSelector;
