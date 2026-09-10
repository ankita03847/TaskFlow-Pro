import React, { useState, useContext } from 'react';
import AuthLayout from '../../components/layout/AuthLayout';
import { useNavigate } from "react-router-dom";
import Input from '../../components/Inputs/inputs';
import { validateEmail } from '../../utils/helper';
import axiosInstance from '../../utils/Axiosinstance';
import { API_PATHS } from '../../utils/ApiPath';
import { UserContext } from '../../context/userContext';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useContext(UserContext);

  // Handle Login Form Submit
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter the password");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email,
        password,
      });

      const { token, role } = response.data;

      if (token) {
        login(response.data, token);

        // Redirect based on role
        if (role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/user/dashboard");
        }
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-[440px] flex flex-col justify-center">
        <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
          Welcome Back
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 mb-6">
          Please enter your details to log in
        </p>

        <form onSubmit={handleLogin} className="w-full flex flex-col">
          <Input
            value={email}
            onChange={({ target }) => setEmail(target.value)}
            label="Email Address"
            placeholder="john@example.com"
            type="text"
          />

          <Input
            value={password}
            onChange={({ target }) => setPassword(target.value)}
            label="Password"
            placeholder="Min 8 Characters"
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
            {isLoading ? "Logging in..." : "Log In"}
          </button>

          <p className="text-xs sm:text-sm text-slate-600 mt-2 text-center sm:text-left">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="text-blue-600 hover:text-blue-700 hover:underline font-semibold cursor-pointer"
            >
              Sign Up
            </button>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Login;