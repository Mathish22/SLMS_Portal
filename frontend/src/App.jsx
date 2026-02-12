import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import EditResource from './pages/EditResource';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/AdminDashboard';
import DepartmentAdminDashboard from './pages/DepartmentAdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import Exam from './pages/Exam';

function App() {
  return (
    <Router>
      <Navbar />
      <div className="min-h-screen items-center justify-center bg-orange-50">

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* Admin Dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Department Admin Dashboard */}
          <Route
            path="/dept-admin"
            element={
              <ProtectedRoute>
                <DepartmentAdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Staff Dashboard */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />

          {/* Student Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/exam"
            element={
              <ProtectedRoute>
                <Exam />
              </ProtectedRoute>
            }
          />

          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <Upload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-resource/:id"
            element={
              <ProtectedRoute>
                <EditResource />
              </ProtectedRoute>
            }
          />

          {/* Redirect old register route to login */}
          <Route path="/register" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;