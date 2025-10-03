import React from 'react';
import { Navigate } from 'react-router';
import { useAdminAuth } from '../context/AdminAuthContext';
import LoadingScreen from '../components/LoadingScreen';

const AdminAuthGuard = ({ children }) => {
    const { isAuthenticated, loading } = useAdminAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default AdminAuthGuard;