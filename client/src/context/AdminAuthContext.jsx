import React, { createContext, useContext, useState, useEffect } from 'react';
import { verifyAdmin } from '../api/admin';

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
    const context = useContext(AdminAuthContext);
    if (!context) {
        throw new Error('useAdminAuth must be used within an AdminAuthProvider');
    }
    return context;
};

export const AdminAuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const checkAdminAuth = async () => {
        try {
            setLoading(true);
            const response = await verifyAdmin();
            setAdmin(response.user);
            setIsAuthenticated(true);
        } catch (error) {
            console.error('Admin auth verification failed:', error);
            setAdmin(null);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAdminAuth();
    }, []);

    const logout = () => {
        setAdmin(null);
        setIsAuthenticated(false);
        // Redirect to login
        window.location.href = '/login';
    };

    const value = {
        admin,
        loading,
        isAuthenticated,
        checkAdminAuth,
        logout
    };

    return (
        <AdminAuthContext.Provider value={value}>
            {children}
        </AdminAuthContext.Provider>
    );
};