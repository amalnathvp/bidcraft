/**
 * API service utilities for making HTTP requests to the backend
 * Provides centralized error handling and request configuration
 */

// Base API configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_URL 
  : '/api'; // Use relative path to leverage proxy

// Helper function to get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Helper function to build headers with authentication
const buildHeaders = (includeAuth: boolean = false): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Generic API request function with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  requireAuth: boolean = false
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...buildHeaders(requireAuth),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`
      }));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${url}:`, error);
    throw error;
  }
}

// Export API methods
export const api = {
  // GET request
  get: <T>(endpoint: string, requireAuth: boolean = false): Promise<T> =>
    apiRequest<T>(endpoint, { method: 'GET' }, requireAuth),

  // POST request
  post: <T>(endpoint: string, data: any, requireAuth: boolean = false): Promise<T> =>
    apiRequest<T>(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      requireAuth
    ),

  // PUT request
  put: <T>(endpoint: string, data: any, requireAuth: boolean = false): Promise<T> =>
    apiRequest<T>(
      endpoint,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      requireAuth
    ),

  // DELETE request
  delete: <T>(endpoint: string, requireAuth: boolean = false): Promise<T> =>
    apiRequest<T>(endpoint, { method: 'DELETE' }, requireAuth),

  // POST with FormData (for file uploads)
  postFormData: <T>(endpoint: string, formData: FormData, requireAuth: boolean = false): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {};
    
    if (requireAuth) {
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return apiRequest<T>(
      endpoint,
      {
        method: 'POST',
        body: formData,
        headers,
      },
      false // Don't add Content-Type for FormData
    );
  },
};

export default api;
