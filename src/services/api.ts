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
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
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
    if (token) {
      config.headers = {
        Authorization: `Bearer ${token}`,
      };
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