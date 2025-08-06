// frontend/src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SearchProvider } from "./context/SearchContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import UploadThesisPage from "./pages/UploadThesisPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ThesisDetailPage from "./pages/ThesisDetailPage";
import ManageUsersPage from "./pages/ManageUsersPage";
import ProfilePage from "./pages/ProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import ThesisToolsPage from "./pages/ThesisToolsPage";
import ErrorBoundary from "./components/ErrorBoundary";
import SearchResultPage from "./pages/SearchResultPage";
import AIAnalysisPage from "./pages/AIAnalysisPage";
import EditThesisPage from "./pages/EditThesisPage";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "./index.css";

// ✅ Custom wrapper to conditionally render homepage
const ConditionalHome = () => {
  const { user } = useAuth();

  if (user && (user.role === "admin" || user.role === "supervisor")) {
    return <Navigate to="/admin-dashboard" replace />;
  }

  return <HomePage />;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <ErrorBoundary>
          <SearchProvider>
            <Navbar />
            <main className="content-wrapper">
              <Routes>
                <Route path="/" element={<ConditionalHome />} />
                <Route path="/search-result" element={<SearchResultPage />} />

                <Route
                  path="/login"
                  element={
                    <PublicOnlyRoute>
                      <LoginPage />
                    </PublicOnlyRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicOnlyRoute>
                      <RegisterPage />
                    </PublicOnlyRoute>
                  }
                />
                <Route path="/thesis/:id" element={<ThesisDetailPage />} />

                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/upload-thesis"
                  element={
                    <ProtectedRoute>
                      <UploadThesisPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/edit-profile"
                  element={
                    <ProtectedRoute>
                      <EditProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/thesis-tools"
                  element={
                    <ProtectedRoute>
                      <ThesisToolsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai-analysis"
                  element={
                    <ProtectedRoute>
                      <AIAnalysisPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin-dashboard"
                  element={
                    <ProtectedRoute requiredRoles={["admin", "supervisor"]}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/manage-users"
                  element={
                    <ProtectedRoute requiredRoles={["admin"]}>
                      <ManageUsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/edit-thesis/:id"
                  element={
                    <ProtectedRoute>
                      <EditThesisPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="*"
                  element={
                    <h1 className="text-center mt-5">404 - Page Not Found</h1>
                  }
                />
              </Routes>
            </main>

            <ToastContainer
              position="top-right"
              autoClose={3000}
              pauseOnHover
              theme="colored"
            />
          </SearchProvider>
        </ErrorBoundary>
      </AuthProvider>
    </Router>
  );
};

export default App;
