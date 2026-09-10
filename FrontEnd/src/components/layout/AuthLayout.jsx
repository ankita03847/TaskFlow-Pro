import React from "react";
import UI_IMG from "../../assets/images/auth-img.png";

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex bg-white">
      {/* Left side content: Form & Branding (Responsive 100% on mobile/tablet, 60vw on desktop) */}
      <div className="w-full md:w-[60vw] min-h-screen px-6 sm:px-10 md:px-12 lg:px-16 pt-6 sm:pt-8 pb-8 flex flex-col justify-between overflow-y-auto">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">
            Task Manager
          </h2>
        </div>

        {/* Centered Form Area */}
        <div className="flex-1 flex flex-col justify-center my-6 sm:my-8">
          {children}
        </div>

        {/* Subtle footer */}
        <div className="text-xs text-slate-400 pt-2">
          &copy; {new Date().getFullYear()} Task Manager. All rights reserved.
        </div>
      </div>

      {/* Right side banner image (Sticky on desktop, hidden on mobile) */}
      <div className="hidden md:flex md:w-[40vw] h-screen sticky top-0 items-center justify-center bg-blue-600 bg-cover bg-no-repeat bg-center overflow-hidden">
        <img
          src={UI_IMG}
          alt="Task Manager Showcase"
          className="w-full h-full object-cover select-none pointer-events-none"
        />
      </div>
    </div>
  );
};

export default AuthLayout;
