/**
 * AP// Helper function to get auth token from localStorage
const getAuthToken = (): string | null => {
  const token = localStorage.getItem('authToken');
  console.log('🔑 Getting auth token from localStorage:', token ? 'Found' : 'Not found');
  if (token) {
    console.log('🔑 Token length:', token.length);
    console.log('🔑 Token preview:', token.substring(0, 30) + '...');
    
    // Validate token format (JWT should have 3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('⚠️ Token format invalid - not a proper JWT (expected 3 parts, got', parts.length, ')');
      console.warn('🔍 Token parts:', parts.map((part, i) => `Part ${i + 1}: ${part.substring(0, 20)}...`));
      return null;
    }
  }
  return token;
};rvice utilities for making HTTP requests to the backend
 * Provides centralized error handling and request configuration
 */

// Base API configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_URL 
  : 'http://localhost:5000/api'; // Direct connection for development

// Helper function to get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
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
      console.log('🔐 Adding Authorization header with token');
      console.log('📝 Authorization header:', `Bearer ${token.substring(0, 30)}...`);
    } else {
      console.warn('⚠️ Auth required but no token available');
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
    
    console.log('📤 Making FormData POST request to:', url);
    console.log('🔐 Auth required:', requireAuth);
    
    if (requireAuth) {
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔐 Added Authorization header to FormData request');
        console.log('📝 Authorization header:', `Bearer ${token.substring(0, 30)}...`);
      } else {
        console.warn('⚠️ FormData request requires auth but no token available');
      }
    }

    return apiRequest<T>(
      endpoint,
      {
        method: 'POST',
        body: formData,
        headers,
      },
      false // Don't add Content-Type for FormData - let browser set it
    );
  },
};

export default api;
