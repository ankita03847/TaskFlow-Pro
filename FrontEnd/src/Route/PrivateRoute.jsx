import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // If not logged in, redirect to login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If roles are specified, check if user's role is allowed
  if (allowedRoles && allowedRoles.length > 0) {
    const isAuthorized =
      allowedRoles.includes(role) ||
      (role === "member" && allowedRoles.includes("user")) ||
      (role === "user" && allowedRoles.includes("member"));

    if (!isAuthorized) {
      // Redirect to the user's appropriate dashboard
      if (role === "admin") {
        return <Navigate to="/admin/dashboard" replace />;
      }
      return <Navigate to="/user/dashboard" replace />;
    }
  }

  return <Outlet />;
};

export default PrivateRoute;
