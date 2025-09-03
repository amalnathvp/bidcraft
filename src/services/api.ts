// API service for making HTTP requests to the backend
// Handles authentication tokens and common request patterns
// Simple, focused service that other modules can use

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Simple API service class for HTTP requests
 * Automatically handles JWT tokens and common headers
 */
class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Make a generic HTTP request with automatic token attachment
   * @param endpoint - API endpoint (e.g., '/auth/login')
   * @param options - Standard fetch options
   */
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Set up default headers
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authentication token if available
    const token = localStorage.getItem('authToken');
    console.log('🔍 API Service: Retrieved token from localStorage:', token);
    console.log('🔍 API Service: Token type:', typeof token);
    console.log('🔍 API Service: Token length:', token ? token.length : 0);
    
    // Check if token is valid (not null, not "null" string, not empty)
    if (token && token !== 'null' && token.trim() !== '') {
      const cleanToken = token.trim();
      console.log('✅ API Service: Adding Authorization header');
      console.log('🔑 API Service: Token preview:', cleanToken.substring(0, 30) + '...');
      
      // Validate JWT format
      const parts = cleanToken.split('.');
      if (parts.length === 3) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${cleanToken}`,
        };
        console.log('✅ API Service: Valid JWT token added to request');
      } else {
        console.error('❌ API Service: Invalid JWT format - parts:', parts.length);
        console.error('❌ API Service: Clearing invalid token from localStorage');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    } else {
      console.log('⚠️ API Service: No valid token available');
      if (token === 'null') {
        console.log('🧹 API Service: Cleaning up "null" string from localStorage');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // Handle non-successful responses
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Simple GET request
   */
  async get(endpoint: string) {
    return this.request(endpoint);
  }

  /**
   * Simple POST request with data
   */
  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * POST request with FormData (for file uploads)
   */
  async postFormData(endpoint: string, formData: FormData) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Set up config without Content-Type for FormData
    const config: RequestInit = {
      method: 'POST',
      body: formData,
    };

    // Add authentication token if available
    const token = localStorage.getItem('authToken');
    console.log('🔍 FormData: Retrieved token from localStorage:', token);
    console.log('🔍 FormData: Token type:', typeof token);
    
    // Check if token is valid (not null, not "null" string, not empty)
    if (token && token !== 'null' && token.trim() !== '') {
      const cleanToken = token.trim();
      console.log('✅ FormData: Adding Authorization header');
      console.log('🔑 FormData: Token preview:', cleanToken.substring(0, 30) + '...');
      
      // Validate JWT format
      const parts = cleanToken.split('.');
      if (parts.length === 3) {
        config.headers = {
          Authorization: `Bearer ${cleanToken}`,
        };
        console.log('✅ FormData: Valid JWT token added to request');
      } else {
        console.error('❌ FormData: Invalid JWT format - parts:', parts.length);
        console.error('❌ FormData: Clearing invalid token from localStorage');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    } else {
      console.log('⚠️ FormData: No valid token available');
      if (token === 'null') {
        console.log('🧹 FormData: Cleaning up "null" string from localStorage');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // Handle non-successful responses
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Simple PUT request with data
   */
  async put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Simple DELETE request
   */
  async delete(endpoint: string) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

// Export a single instance to use throughout the app
export const apiService = new ApiService();
export default apiService;