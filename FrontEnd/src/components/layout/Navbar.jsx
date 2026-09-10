import React, { useContext, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuMenu,
  LuX,
  LuSquareCheck,
  LuSearch,
  LuPlus,
  LuBell,
  LuLogOut,
  LuUser,
  LuShieldCheck,
  LuChevronDown,
} from "react-icons/lu";
import { UserContext } from "../../context/userContext";

const Navbar = ({ toggleSideMenu, isSideMenuOpen }) => {
  const { user, logout } = useContext(UserContext);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setProfileDropdownOpen(false);
    logout();
    navigate("/login");
  };

  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* Left Side: Mobile Menu Button & Brand Logo */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={toggleSideMenu}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 min-[1080px]:hidden transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isSideMenuOpen ? <LuX size={22} /> : <LuMenu size={22} />}
          </button>

          {/* Modern Brand Logo */}
          <div
            onClick={() => navigate(isAdmin ? "/admin/dashboard" : "/user/dashboard")}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <LuSquareCheck size={20} className="stroke-[2.2]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                TaskFlow
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-blue-50 text-blue-600 rounded-md border border-blue-200/60">
                PRO
              </span>
            </div>
          </div>
        </div>

        {/* Center: Command-Style Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <LuSearch size={16} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Quick search tasks, members..."
              className="w-full pl-9 pr-14 py-1.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/90 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
            />
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
              <kbd className="text-[10px] font-semibold text-slate-400 bg-slate-200/60 border border-slate-300/60 px-1.5 py-0.5 rounded-md">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Action & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Create Task (Admin only) */}
          {isAdmin && (
            <button
              onClick={() => navigate("/admin/create-task")}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs shadow-blue-600/25 transition-all cursor-pointer hover:shadow-md"
            >
              <LuPlus size={15} className="stroke-[2.5]" />
              <span>New Task</span>
            </button>
          )}

          {/* Notification Bell with Ping */}
          <button
            type="button"
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <LuBell size={19} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white"></span>
          </button>

          {/* Profile Pill & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100/80 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              aria-expanded={profileDropdownOpen}
            >
              {/* Avatar with Online Badge */}
              <div className="relative w-8 h-8 rounded-full">
                {user?.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user?.name || "User Avatar"}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
              </div>

              {/* User Name & Role */}
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-tight max-w-[110px] truncate">
                  {user?.name || "User"}
                </span>
                <span className="text-[10px] text-slate-500 capitalize">
                  {user?.role === "admin" ? "Administrator" : "Team Member"}
                </span>
              </div>

              <LuChevronDown
                size={14}
                className={`text-slate-400 transition-transform ${profileDropdownOpen ? "rotate-180 text-slate-600" : ""
                  }`}
              />
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Header info */}
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {user?.name || "User"}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {user?.email || ""}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                    <LuShieldCheck size={12} className="text-blue-600" />
                    <span className="capitalize">{user?.role || "member"} Account</span>
                  </div>
                </div>

                {/* Navigation links */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate(isAdmin ? "/admin/dashboard" : "/user/dashboard");
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors cursor-pointer text-left"
                  >
                    <LuSquareCheck size={15} />
                    <span>Dashboard Home</span>
                  </button>

                  {isAdmin ? (
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate("/admin/task");
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors cursor-pointer text-left"
                    >
                      <LuUser size={15} />
                      <span>Manage Tasks</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate("/user/myTask");
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors cursor-pointer text-left"
                    >
                      <LuUser size={15} />
                      <span>My Assigned Tasks</span>
                    </button>
                  )}
                </div>

                {/* Sign Out */}
                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left font-medium"
                  >
                    <LuLogOut size={15} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};

export default Navbar;
