// Authentication context - manages app-wide user state
// Simple React context for authentication state management
// Provides hooks for login, logout, and user data access

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User, LoginCredentials, RegisterData } from '../services/auth';

// Context interface - simple and focused
interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

// Create context with undefined default (will error if used without provider)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Custom hook to use authentication context
 * Throws error if used outside AuthProvider - helps catch mistakes early
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider props interface
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication provider component
 * Manages user state and provides auth methods to children
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Simple state management
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to clear error messages
  const clearError = () => setError(null);

  // Initialize authentication state when provider mounts
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user data is stored locally
        const storedUser = authService.getCurrentUserFromStorage();
        if (storedUser && authService.isAuthenticated()) {
          setUser(storedUser);
          
          // Verify with server to ensure token is still valid
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        // Clear invalid stored data
        authService.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login method - handles login and updates state
   */
  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.login(credentials);
      setUser(response.user);
    } catch (error: any) {
      setError(error.message || 'Login failed');
      throw error; // Re-throw for component handling
    } finally {
      setLoading(false);
    }
  };

  /**
   * Registration method - handles signup and updates state
   */
  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.register(userData);
      setUser(response.user);
    } catch (error: any) {
      setError(error.message || 'Registration failed');
      throw error; // Re-throw for component handling
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout method - clears state and stored data
   */
  const logout = () => {
    authService.logout();
    setUser(null);
    setError(null);
  };

  // Context value object
  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};