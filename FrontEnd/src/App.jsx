import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Context Provider
import UserProvider from './context/userContext';

// Error Boundary
import ErrorBoundary from './components/common/ErrorBoundary';

// Route Protection
import PrivateRoute from './Route/PrivateRoute';

// Auth Pages
import Login from './pages/Auth/Login';
import SignUp from './pages/Auth/Signup';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import ManagerTask from './pages/admin/ManagerTask';
import CreateTask from './pages/admin/CreateTask';
import ManagerUser from './pages/admin/ManagerUser';

// User Pages
import UserDashboard from './pages/User/UserDashboard';
import MyTask from './pages/User/Mytask';
import ViewTaskDetails from './pages/User/ViewTaskDetails';

function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontSize: "13px",
              borderRadius: "10px",
              background: "#1e293b",
              color: "#fff",
            },
          }}
        />
        <Router>
          <Routes>
            {/* Default redirect to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signUp" element={<SignUp />} />

            {/* Admin Routes */}
            <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/task" element={<ManagerTask />} />
              <Route path="/admin/task-details/:id" element={<ViewTaskDetails />} />
              <Route path="/admin/task/:id" element={<ViewTaskDetails />} />
              <Route path="/admin/create-task" element={<CreateTask />} />
              <Route path="/admin/User" element={<ManagerUser />} />
              <Route path="/admin/user" element={<ManagerUser />} />
            </Route>

            {/* User Routes */}
            <Route element={<PrivateRoute allowedRoles={["member", "user", "admin"]} />}>
              <Route path="/user/dashboard" element={<UserDashboard />} />
              <Route path="/User/dashboard" element={<UserDashboard />} />
              <Route path="/user/myTask" element={<MyTask />} />
              <Route path="/User/myTask" element={<MyTask />} />
              <Route path="/user/task-details/:id" element={<ViewTaskDetails />} />
              <Route path="/User/task-details/:id" element={<ViewTaskDetails />} />
            </Route>

            {/* 404 / Catch-all redirect */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </UserProvider>
    </ErrorBoundary>
  );
}

export default App;
