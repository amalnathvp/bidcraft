// Authentication service - handles user login, registration, and session management
// Simple interface to backend auth API
// Manages local storage for tokens and user data

import { apiService } from './api';

// Simple user data interface
export interface User {
  id: string;
  _id?: string;
  name: string;
  firstName?: string; // Derived from name
  lastName?: string;  // Derived from name
  email: string;
  role: string;
  isVerified?: boolean;
  avatar?: string;
  shopName?: string;
  sellerRating?: number;
}

// API response format for authentication
export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

// Login form data
export interface LoginCredentials {
  email: string;
  password: string;
}

// Registration form data
export interface RegisterData {
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  role?: string;
}

/**
 * Simple authentication service
 * Handles login, registration, and session management
 */
class AuthService {
  
  /**
   * Register a new user account
   * Stores token and user data on success
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiService.post('/auth/register', userData);
      
      // Store auth data if registration successful
      if (response.success && response.token) {
        this.storeAuthData(response.token, response.user);
      }
      
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Login with email and password
   * Stores token and user data on success
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiService.post('/auth/login', credentials);
      
      // Store auth data if login successful
      if (response.success && response.token) {
        this.storeAuthData(response.token, response.user);
      }
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Get current user data from server
   * Validates stored token
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return null;
      }

      const response = await apiService.get('/auth/me');
      
      if (response.success && response.user) {
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(response.user));
        return response.user;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      // Clear invalid auth data
      this.logout();
      return null;
    }
  }

  /**
   * Logout user and clear stored data
   */
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

  /**
   * Get user data from local storage
   * Used for immediate access without API call
   */
  getCurrentUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Private method to store authentication data
   */
  private storeAuthData(token: string, user: User): void {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
}

// Export single instance to use throughout the app
export const authService = new AuthService();
export default authService;