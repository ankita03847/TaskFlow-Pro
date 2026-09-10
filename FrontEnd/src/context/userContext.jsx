import React, { createContext, useState, useEffect } from "react";
import axiosInstance from "../utils/Axiosinstance";
import { API_PATHS } from "../utils/ApiPath";

export const UserContext = createContext();

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true); // New state to track loading

  // Function to log in user and set profile
  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
    localStorage.setItem("role", userData.role);
  };

  // Function to log out user
  const logout = () => {        
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
  };

  useEffect(() => {
    const accessToken = localStorage.getItem("token");
    if (!accessToken) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
        setUser(response.data);
        localStorage.setItem("user", JSON.stringify(response.data));
        if (response.data.role) {
          localStorage.setItem("role", response.data.role);
        }
      } catch (error) {
        console.error("User not authenticated", error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const updateUser = (updatedData) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedData };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        logout,
        clearUser: logout,
        updateUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;