
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Query from "./pages/Query";
import SchemaExplorer from "./pages/SchemaExplorer";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* User routes */}
          <Route
            path="/query"
            element={
              <ProtectedRoute>
                <Query />
              </ProtectedRoute>
            }
          />

          <Route
            path="/schema"
            element={
              <ProtectedRoute>
                <SchemaExplorer />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <Navigate to="/admin/statistics" replace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/statistics"
            element={
              <ProtectedRoute requireAdmin>
                <Admin section="statistics" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin>
                <Admin section="users" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/activity"
            element={
              <ProtectedRoute requireAdmin>
                <Admin section="activity" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/feedback"
            element={
              <ProtectedRoute requireAdmin>
                <Admin section="feedback" />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
