import React, { useContext, useState } from "react";
import { UserContext } from "../../context/userContext";
import Navbar from "./Navbar";
import SideMenu from "./SideMenu";

const DashboardLayout = ({ children, activeMenu }) => {
  const { user } = useContext(UserContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col font-sans antialiased text-slate-800 selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeMenu={activeMenu}
        toggleSideMenu={toggleMobileMenu}
        isSideMenuOpen={mobileMenuOpen}
      />

      {/* Main Body Area */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        {/* Desktop Sidebar (visible >= 1080px) */}
        <div className="hidden min-[1080px]:block shrink-0">
          <SideMenu activeMenu={activeMenu} />
        </div>

        {/* Mobile Slide-Over Drawer (< 1080px) */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 min-[1080px]:hidden flex">
            {/* Dark Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
              onClick={closeMobileMenu}
            />

            {/* Slide-in Drawer Container */}
            <div className="relative flex flex-col w-72 max-w-[85vw] bg-white h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
              <SideMenu
                activeMenu={activeMenu}
                closeMobileMenu={closeMobileMenu}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8 transition-all">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;