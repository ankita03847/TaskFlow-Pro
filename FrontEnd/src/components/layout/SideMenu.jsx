import React, { useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LuLayoutDashboard,
  LuListTodo,
  LuCirclePlus,
  LuUsers,
  LuFileSpreadsheet,
  LuLogOut,
} from "react-icons/lu";
import { UserContext } from "../../context/userContext";
import axiosInstance from "../../utils/Axiosinstance";
import { API_PATHS } from "../../utils/ApiPath";
import toast from "react-hot-toast";

const SideMenu = ({ activeMenu, closeMobileMenu }) => {
  const { user, logout } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.role === "admin";

  // Admin Navigation Items
  const adminMenuItems = [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: LuLayoutDashboard,
    },
    {
      label: "Manage Tasks",
      path: "/admin/task",
      icon: LuListTodo,
    },
    {
      label: "Create Task",
      path: "/admin/create-task",
      icon: LuCirclePlus,
    },
    {
      label: "Team Members",
      path: "/admin/user",
      icon: LuUsers,
    },
  ];

  // Team Member Navigation Items
  const memberMenuItems = [
    {
      label: "Dashboard",
      path: "/user/dashboard",
      icon: LuLayoutDashboard,
    },
    {
      label: "My Tasks",
      path: "/user/myTask",
      icon: LuListTodo,
    },
  ];

  const currentMenuItems = isAdmin ? adminMenuItems : memberMenuItems;

  const handleNavigate = (path) => {
    navigate(path);
    if (closeMobileMenu) closeMobileMenu();
  };

  // One-click Report Download Handler
  const handleExportTasks = async () => {
    try {
      toast.loading("Generating tasks report...", { id: "export-tasks" });
      const response = await axiosInstance.get(API_PATHS.REPORTS.EXPORT_TASKS, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `TaskReport_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Tasks Excel report downloaded!", { id: "export-tasks" });
    } catch (error) {
      console.error("Failed to export tasks report:", error);
      toast.error("Failed to download tasks report", { id: "export-tasks" });
    }
  };

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
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `UserReport_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Users report downloaded!", { id: "export-users" });
    } catch (error) {
      console.error("Failed to export users report:", error);
      toast.error("Failed to download users report", { id: "export-users" });
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 select-none">
      <div className="p-4 space-y-6 overflow-y-auto">
        
        {/* Workspace pill */}
        <div className="p-3 bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-xl border border-slate-200/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {isAdmin ? "A" : "M"}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 tracking-tight">
                {isAdmin ? "Admin Console" : "Member Workspace"}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">TaskFlow Engine</p>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>

        {/* Main Navigation Section */}
        <div>
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Main Navigation
          </p>
          <nav className="space-y-1">
            {currentMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeMenu === item.label ||
                location.pathname === item.path ||
                location.pathname.toLowerCase() === item.path.toLowerCase();

              return (
                <button
                  key={item.label}
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-blue-50 text-blue-600 shadow-2xs font-bold border-r-2 border-blue-600"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  <Icon
                    size={17}
                    className={`transition-colors ${
                      isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Report Exports Section (Admin only) */}
        {isAdmin && (
          <div>
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Instant Reports
            </p>
            <div className="space-y-1">
              <button
                onClick={handleExportTasks}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <LuFileSpreadsheet size={16} className="text-emerald-600" />
                  <span>Tasks (.xlsx)</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded-md border border-emerald-200/50">
                  Export
                </span>
              </button>

              <button
                onClick={handleExportUsers}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <LuFileSpreadsheet size={16} className="text-blue-600" />
                  <span>Users (.xlsx)</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-md border border-blue-200/50">
                  Export
                </span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Footer Section: User card and Log Out */}
      <div className="p-4 border-t border-slate-200/70 bg-slate-50/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt={user?.name || "Avatar"}
                className="w-8 h-8 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                {user?.name || "User"}
              </p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                {user?.email || ""}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
            aria-label="Log Out"
          >
            <LuLogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default SideMenu;
