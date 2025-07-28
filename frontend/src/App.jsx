// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SearchProvider } from './context/SearchContext.jsx';
import ProtectedRoute from './components/ProtectedRoute'; // Corrected import
import PublicOnlyRoute from './components/PublicOnlyRoute';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UploadThesisPage from './pages/UploadThesisPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ThesisDetailPage from './pages/ThesisDetailPage';
import ManageUsersPage from './pages/ManageUsersPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import ThesisToolsPage from './pages/ThesisToolsPage';
import ErrorBoundary from './components/ErrorBoundary';
import SearchResultPage from './pages/SearchResultPage';
import AIAnalysisPage from './pages/AIAnalysisPage'; // NEW: Import AIAnalysisPage

import './App.css';
import './index.css';
import './styles/DarkTheme.css';


const App = () => {
  /*
  // Temporarily inactive dark theme functionality
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    if (isDarkTheme) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [isDarkTheme]);
  */

  return (
    <Router>
      <AuthProvider>
        <ErrorBoundary>
          <SearchProvider>
            <Navbar />
            <main className="content-wrapper">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/search-result" element={<SearchResultPage />} />

                {/* Public Only Routes */}
                <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
                <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

                {/* Public routes for all users (e.g., viewing a thesis) */}
                <Route path="/thesis/:id" element={<ThesisDetailPage />} />

                {/* Protected Routes for all authenticated users */}
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/upload-thesis" element={<ProtectedRoute><UploadThesisPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/edit-profile" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
                <Route path="/thesis-tools" element={<ProtectedRoute><ThesisToolsPage /></ProtectedRoute>} />

                {/* NEW: Route for the AI Analysis Page */}
                {/* You might want to make this accessible only to authenticated users */}
                <Route path="/ai-analysis" element={<ProtectedRoute><AIAnalysisPage /></ProtectedRoute>} />


                {/* Admin/Supervisor Protected Routes */}
                <Route path="/admin-dashboard" element={<ProtectedRoute requiredRoles={['admin', 'supervisor']}><AdminDashboardPage /></ProtectedRoute>} />
                <Route path="/manage-users" element={<ProtectedRoute requiredRoles={['admin']}><ManageUsersPage /></ProtectedRoute>} />

                {/* Catch-all for 404 - Optional */}
                <Route path="*" element={<h1 className="text-center mt-5">404 - Page Not Found</h1>} />
              </Routes>
            </main>
          </SearchProvider>
        </ErrorBoundary>
      </AuthProvider>
    </Router>
  );
};

export default App;