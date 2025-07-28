// frontend/src/components/PublicOnlyRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PublicOnlyRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return null;
    }

    return isAuthenticated ? <Navigate to="/dashboard" /> : children;
};

export default PublicOnlyRoute;