import React, { useState } from "react";
import AuthLayout from "../../components/layout/AuthLayout";
import { useNavigate, useLocation } from "react-router-dom";
import Input from "../../components/Inputs/inputs";
import { validateEmail } from "../../utils/helper";
import axiosInstance from "../../utils/Axiosinstance";
import { API_PATHS } from "../../utils/ApiPath";
import toast from "react-hot-toast";
import { FiArrowLeft, FiKey, FiCheckCircle } from "react-icons/fi";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!newPassword) {
      setError("Please enter your new password.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.RESET_PASSWORD, {
        email: email.trim(),
        newPassword,
      });

      setIsSuccess(true);
      toast.success(
        response.data?.message || "Password reset successfully!"
      );

      // Auto redirect to login after 1.5 seconds so user can see success confirmation
      setTimeout(() => {
        navigate("/login", { state: { email } });
      }, 1500);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Unable to reset password. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-[440px] flex flex-col justify-center">
        {/* Back Link */}
        <button
          type="button"
          onClick={() => navigate("/login", { state: { email } })}
          className="inline-flex items-center text-xs sm:text-sm font-medium text-slate-500 hover:text-blue-600 mb-5 transition-colors cursor-pointer w-fit group"
        >
          <FiArrowLeft className="mr-1.5 transition-transform group-hover:-translate-x-0.5" />
          Back to Log In
        </button>

        <div className="flex items-center space-x-2.5 mb-1.5">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FiKey size={18} />
          </div>
          <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
            Reset Password
          </h3>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 mb-6">
          Enter your registered email address and choose a new password.
        </p>

        {isSuccess ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center animate-in fade-in duration-300">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiCheckCircle size={26} />
            </div>
            <h4 className="text-base font-semibold text-emerald-900 mb-1">
              Password Reset Successful!
            </h4>
            <p className="text-xs sm:text-sm text-emerald-700 mb-4">
              Your password has been updated. Redirecting you to the log in screen...
            </p>
            <button
              type="button"
              onClick={() => navigate("/login", { state: { email } })}
              className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Log In Now
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="w-full flex flex-col">
            <Input
              value={email}
              onChange={({ target }) => setEmail(target.value)}
              label="Registered Email Address"
              placeholder="name@example.com"
              type="email"
            />

            <Input
              value={newPassword}
              onChange={({ target }) => setNewPassword(target.value)}
              label="New Password"
              placeholder="Min 8 Characters"
              type="password"
            />

            <Input
              value={confirmPassword}
              onChange={({ target }) => setConfirmPassword(target.value)}
              label="Confirm New Password"
              placeholder="Re-enter new password"
              type="password"
            />

            {error && (
              <p className="text-red-500 text-xs pb-2.5 font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer my-2 shadow-sm ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Resetting Password..." : "Reset Password"}
            </button>

            <p className="text-xs sm:text-sm text-slate-600 mt-3 text-center">
              Remember your password?{" "}
              <button
                type="button"
                onClick={() => navigate("/login", { state: { email } })}
                className="text-blue-600 hover:text-blue-700 hover:underline font-semibold cursor-pointer"
              >
                Log In
              </button>
            </p>
          </form>
        )}
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
