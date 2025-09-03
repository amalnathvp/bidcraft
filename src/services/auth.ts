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
   * Development admin login bypass (no password required)
   * Only works in development environment
   */
  async devAdminLogin(): Promise<AuthResponse> {
    try {
      console.log('🚀 Dev Admin: Instant admin login');
      const response = await apiService.post('/auth/dev-admin', {});
      
      // Store auth data if login successful
      if (response.success && response.token) {
        this.storeAuthData(response.token, response.user);
        console.log('✅ Dev Admin: Login successful, user role:', response.user.role);
      }
      
      return response;
    } catch (error) {
      console.error('Dev admin login failed:', error);
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
      console.log('🔍 Get Current User: Token from storage:', token);
      console.log('🔍 Get Current User: Token type:', typeof token);
      
      if (!token || token === 'null' || token.trim() === '') {
        console.log('⚠️ Get Current User: No valid token available');
        if (token === 'null') {
          console.log('🧹 Get Current User: Cleaning "null" string from localStorage');
          this.logout();
        }
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
    console.log('🚪 Auth Service: Logging out and clearing storage');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    console.log('✅ Auth Service: Storage cleared');
  }

  /**
   * Debug method to check localStorage state
   */
  debugStorage(): void {
    console.log('🔍 Auth Debug: localStorage state');
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    console.log('🔑 Token:', token);
    console.log('🔑 Token type:', typeof token);
    console.log('🔑 Token length:', token ? token.length : 0);
    console.log('👤 User:', user);
    
    if (token === 'null') {
      console.log('❌ Found "null" string - this is the problem!');
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    console.log('🔍 Auth Service: Checking authentication');
    console.log('🔍 Auth Service: Token from storage:', token);
    console.log('🔍 Auth Service: Token type:', typeof token);
    
    // Return true only if we have a valid token (not null, not "null" string)
    const isValid = !!(token && token !== 'null' && token.trim() !== '');
    console.log('🔍 Auth Service: Is authenticated:', isValid);
    
    if (token === 'null') {
      console.log('🧹 Auth Service: Found "null" string, cleaning localStorage');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      return false;
    }
    
    return isValid;
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
    console.log('💾 Storing auth data');
    console.log('🔑 Token to store - length:', token.length);
    console.log('🔑 Token to store - preview:', token.substring(0, 30) + '...');
    
    // Validate token before storing
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('❌ Attempting to store invalid JWT token - wrong number of parts:', parts.length);
      throw new Error('Invalid JWT token format');
    }
    
    // Clean the token (remove any whitespace)
    const cleanToken = token.trim();
    if (cleanToken !== token) {
      console.warn('⚠️ Token had whitespace, cleaned it');
    }
    
    localStorage.setItem('authToken', cleanToken);
    localStorage.setItem('user', JSON.stringify(user));
    console.log('✅ Auth data stored successfully');
  }
}

// Export single instance to use throughout the app
export const authService = new AuthService();
export default authService;