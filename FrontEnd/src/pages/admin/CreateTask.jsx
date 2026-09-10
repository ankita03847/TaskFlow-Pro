import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuArrowLeft,
  LuPlus,
  LuTrash2,
  LuCheck,
  LuUsers,
  LuCalendar,
  LuFlag,
  LuListTodo,
  LuSparkles,
  LuInfo,
  LuZap,
} from "react-icons/lu";
import toast from "react-hot-toast";
import moment from "moment";

import DashboardLayout from "../../components/layout/DashboardLayout";
import useUserAuth from "../../hooks/UseUserAuth";
import axiosInstance from "../../utils/Axiosinstance";
import { API_PATHS } from "../../utils/ApiPath";
import parseTaskInput from "../../utils/parseTaskInput";

const CreateTask = () => {
  useUserAuth();
  const navigate = useNavigate();

  const [quickInput, setQuickInput] = useState("");
  const [dateConfidenceNote, setDateConfidenceNote] = useState("");
  const [lastParsed, setLastParsed] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState([]);
  const [todoChecklist, setTodoChecklist] = useState([]);
  const [newTodoText, setNewTodoText] = useState("");
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Quick Add Natural Language Parser
  const handleQuickAdd = (e, overrideText = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const textToParse = overrideText !== null ? overrideText : quickInput;
    if (!textToParse || !textToParse.trim()) {
      toast.error("Please enter a sentence to extract task details");
      return;
    }

    if (overrideText !== null) {
      setQuickInput(overrideText);
    }

    const parsed = parseTaskInput(textToParse);
    setLastParsed(parsed);

    // 1. Pre-fill Title
    if (parsed.title) {
      setTitle(parsed.title);
    }

    // 2. Pre-fill Priority
    if (parsed.priority) {
      const p = parsed.priority.toLowerCase();
      if (p === "high") setPriority("High");
      else if (p === "low") setPriority("Low");
      else setPriority("Medium");
    }

    // 3. Pre-fill Due Date & Handle Confidence
    if (parsed.confidence === "high" && parsed.dueDate) {
      const formattedDate = moment(parsed.dueDate).format("YYYY-MM-DD");
      setDueDate(formattedDate);
      setDateConfidenceNote("");
      toast.success("Task details auto-extracted!");
    } else {
      setDueDate("");
      setDateConfidenceNote("Couldn't detect a date — please select one manually below");
      toast("Couldn't detect a date — please select one manually", {
        icon: "⚠️",
      });
    }
  };

  // Fetch available team members to assign
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
        setUsersList(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Failed to load users:", err);
        toast.error("Could not load team members");
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // Toggle User Assignment
  const toggleAssignUser = (userId) => {
    setAssignedTo((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Add Todo Item
  const handleAddTodo = (e) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    setTodoChecklist((prev) => [
      ...prev,
      { text: newTodoText.trim(), completed: false },
    ]);
    setNewTodoText("");
  };

  // Remove Todo Item
  const handleRemoveTodo = (index) => {
    setTodoChecklist((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit New Task
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please provide a task title");
      return;
    }

    if (!description.trim()) {
      toast.error("Please provide a task description");
      return;
    }

    if (!dueDate) {
      toast.error("Please select a due date");
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.post(API_PATHS.TASKS.CREATE_TASK, {
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate,
        assignedTo,
        todoChecklist,
      });

      toast.success("Task created successfully!");
      navigate("/admin/task");
    } catch (err) {
      console.error("Failed to create task:", err);
      const msg = err.response?.data?.message || "Failed to create task";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout activeMenu="Create Task">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Back Link & Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/task")}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
              aria-label="Go Back"
            >
              <LuArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Create New Task
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Define deliverables, deadlines, and assign team members
              </p>
            </div>
          </div>
        </div>

        {/* Task Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6"
        >
          {/* ⚡ Option 1: AI Glow & Glassmorphism Quick Add Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50/90 via-sky-50/50 to-blue-50/80 border border-indigo-200/90 rounded-2xl p-5 sm:p-6 shadow-sm">
            {/* Ambient Background Glow Orbs */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br from-indigo-400/20 to-sky-400/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-gradient-to-tr from-blue-400/15 to-purple-400/15 rounded-full blur-2xl pointer-events-none" />

            {/* Header with Brand Gradient Badge */}
            <div className="relative z-10 flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 shrink-0">
                  <LuSparkles size={18} className="stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    Magic Quick Add
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                    Type freely in natural language — we'll extract the title, deadline, and priority ✨
                  </p>
                </div>
              </div>
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/85 border border-indigo-200/70 shadow-2xs text-[11px] font-bold text-indigo-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>AI Parser Active</span>
              </div>
            </div>

            {/* Input & Action Button */}
            <div className="relative z-10 flex flex-col sm:flex-row gap-2.5 mt-3">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-500/70">
                  <LuSparkles size={16} />
                </span>
                <input
                  type="text"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleQuickAdd(e);
                    }
                  }}
                  placeholder="e.g. submit assignment tomorrow 5pm high priority"
                  className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-white/95 backdrop-blur-md border border-indigo-200/80 focus:border-indigo-500 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all font-medium shadow-2xs"
                />
              </div>
              <button
                type="button"
                onClick={(e) => handleQuickAdd(e)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 hover:from-blue-700 hover:via-indigo-700 hover:to-sky-600 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/25 hover:shadow-lg hover:shadow-indigo-600/35 transition-all cursor-pointer shrink-0"
              >
                <LuSparkles size={15} />
                <span>Auto-Fill Form</span>
              </button>
            </div>

            {/* Interactive Quick Suggestion Chips */}
            <div className="relative z-10 flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-indigo-100/90">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                <LuZap size={13} className="text-amber-500" />
                Try:
              </span>
              {[
                { label: "submit assignment tomorrow 5pm high priority", emoji: "⚡" },
                { label: "urgent: fix server bug asap", emoji: "🔥" },
                { label: "finish report next monday, low priority", emoji: "📅" },
                { label: "organize archive folders whenever no rush", emoji: "🌿" },
              ].map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => handleQuickAdd(null, sample.label)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-white/90 hover:bg-white hover:border-indigo-300 text-slate-700 hover:text-indigo-600 rounded-lg border border-slate-200/80 shadow-2xs transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>{sample.emoji}</span>
                  <span>{sample.label}</span>
                </button>
              ))}
            </div>

            {/* Live Detected Highlights Strip */}
            {lastParsed && (
              <div className="relative z-10 mt-3 flex flex-wrap items-center gap-2 p-2.5 bg-white/90 border border-indigo-100 rounded-xl shadow-2xs text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Extracted:
                </span>
                {lastParsed.title && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-semibold">
                    📝 {lastParsed.title}
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-[11px] uppercase ${
                    priority === "High"
                      ? "bg-rose-100 text-rose-700 border border-rose-200"
                      : priority === "Low"
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-blue-100 text-blue-700 border border-blue-200"
                  }`}
                >
                  <LuFlag size={11} />
                  {priority} Priority
                </span>
                {dueDate ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-sky-100 text-sky-800 font-semibold border border-sky-200">
                    <LuCalendar size={11} />
                    {dueDate}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-semibold text-[11px] border border-amber-200">
                    ⚠️ Date manual
                  </span>
                )}
              </div>
            )}

            {/* Low confidence visual note */}
            {dateConfidenceNote && (
              <div className="relative z-10 mt-3 flex items-center gap-2 p-2.5 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium">
                <LuInfo size={15} className="text-amber-600 shrink-0" />
                <span>{dateConfidenceNote}</span>
              </div>
            )}
          </div>

          {/* 1. Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design user authentication flow in Figma"
              className="w-full px-4 py-2.5 text-sm bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              required
            />
          </div>

          {/* 2. Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Provide context, acceptance criteria, and helpful links..."
              className="w-full px-4 py-2.5 text-sm bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium resize-y"
              required
            />
          </div>

          {/* 3. Priority & Due Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Priority Picker */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <LuFlag size={14} className="text-blue-600" />
                  Priority Level
                </span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["Low", "Medium", "High"].map((level) => {
                  const isSelected = priority === level;
                  const colorClass =
                    level === "High"
                      ? isSelected
                        ? "bg-rose-500 text-white border-rose-500 shadow-xs"
                        : "text-rose-600 border-rose-200 hover:bg-rose-50"
                      : level === "Medium"
                      ? isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "text-blue-600 border-blue-200 hover:bg-blue-50"
                      : isSelected
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "text-emerald-600 border-emerald-200 hover:bg-emerald-50";

                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setPriority(level)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${colorClass}`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Due Date Picker */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <LuCalendar size={14} className="text-blue-600" />
                  Due Date <span className="text-rose-500">*</span>
                </span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  setDateConfidenceNote("");
                }}
                min={moment().format("YYYY-MM-DD")}
                className="w-full px-4 py-2.5 text-sm bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                required
              />
              {dateConfidenceNote && (
                <p className="text-[11px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
                  <LuInfo size={12} />
                  <span>{dateConfidenceNote}</span>
                </p>
              )}
            </div>
          </div>

          {/* 4. Assign Team Members */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <LuUsers size={14} className="text-blue-600" />
                Assign Team Members ({assignedTo.length} selected)
              </span>
            </label>

            <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
              {loadingUsers ? (
                <p className="text-xs text-slate-400 py-3 text-center">Loading team members...</p>
              ) : usersList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {usersList.map((member) => {
                    const isAssigned = assignedTo.includes(member._id);
                    return (
                      <div
                        key={member._id}
                        onClick={() => toggleAssignUser(member._id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isAssigned
                            ? "bg-blue-50/80 border-blue-300 text-blue-900 shadow-2xs"
                            : "bg-white border-slate-200/80 hover:border-slate-300 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {member.profileImageUrl ? (
                            <img
                              src={member.profileImageUrl}
                              alt={member.name}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-700 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                              {member.name ? member.name.charAt(0).toUpperCase() : "M"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate leading-tight">
                              {member.name}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {member.email}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                            isAssigned
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isAssigned && <LuCheck size={12} className="stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No registered team members found.
                </p>
              )}
            </div>
          </div>

          {/* 5. Todo Checklist Builder */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <LuListTodo size={14} className="text-blue-600" />
                Subtask Checklist ({todoChecklist.length} items)
              </span>
            </label>

            {/* Input to add todo item */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTodo(e);
                  }
                }}
                placeholder="Type checklist step and press Add..."
                className="flex-1 px-4 py-2 text-xs sm:text-sm bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
              <button
                type="button"
                onClick={handleAddTodo}
                className="inline-flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <LuPlus size={15} />
                <span>Add</span>
              </button>
            </div>

            {/* Render checklist items */}
            {todoChecklist.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {todoChecklist.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs"
                  >
                    <span className="font-medium text-slate-800">{item.text}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTodo(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <LuTrash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/task")}
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-blue-600/25 transition-all cursor-pointer ${
                submitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              <LuPlus size={16} className="stroke-[2.5]" />
              <span>{submitting ? "Creating Task..." : "Publish Task"}</span>
            </button>
          </div>
        </form>

      </div>
    </DashboardLayout>
  );
};

export default CreateTask;