import React, { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";

const Input = ({ value, onChange, label, placeholder, type }) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full mb-4">
      {label && (
        <label className="block text-xs sm:text-[13px] text-slate-700 font-medium mb-1.5">
          {label}
        </label>
      )}

      <div className="input-box flex items-center justify-between w-full border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white transition-all focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
        <input
          type={
            type === "password" ? (showPassword ? "text" : "password") : type
          }
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400"
          value={value}
          onChange={(e) => onChange(e)}
        />

        {type === "password" && (
          <button
            type="button"
            onClick={toggleShowPassword}
            className="text-slate-400 hover:text-slate-600 focus:outline-none ml-2 p-1 rounded-md transition-colors cursor-pointer shrink-0 flex items-center justify-center"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <FaRegEye size={19} className="text-blue-600" />
            ) : (
              <FaRegEyeSlash size={19} />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default Input;
