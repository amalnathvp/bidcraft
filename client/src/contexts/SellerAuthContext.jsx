import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Create the context
const SellerAuthContext = createContext();

// API functions
const checkSellerAuth = async () => {
  try {
    const response = await fetch('/user', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      // Only throw error for authentication failures, not network issues
      if (response.status === 401 || response.status === 403) {
        console.log('Seller auth check failed - unauthorized:', response.status);
        throw new Error(`Authentication failed: ${response.status}`);
      }
      // For other errors (500, etc.), don't throw - let retry handle it
      console.log('Seller auth check - server error, will retry:', response.status);
      throw new Error(`Server error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Seller auth check success:', data);
    return data;
  } catch (error) {
    console.log('Seller auth check error:', error);
    throw error;
  }
};

const sellerLogout = async () => {
  const response = await fetch('/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Logout failed');
  }
  
  return response.json();
};

// Provider component
export const SellerAuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  
  // Initialize state from localStorage for persistence
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const savedAuth = localStorage.getItem('sellerAuth');
      return savedAuth ? JSON.parse(savedAuth).isAuthenticated : false;
    } catch {
      return false;
    }
  });
  
  const [seller, setSeller] = useState(() => {
    try {
      const savedAuth = localStorage.getItem('sellerAuth');
      return savedAuth ? JSON.parse(savedAuth).seller : null;
    } catch {
      return null;
    }
  });

  // Query to check authentication status
  const { data: authData, isLoading, error, refetch } = useQuery({
    queryKey: ['sellerAuth'],
    queryFn: checkSellerAuth,
    enabled: !seller || !isAuthenticated, // Only fetch if not already authenticated
    initialData: seller ? { user: seller.user } : undefined, // Use localStorage data as initial data
    retry: (failureCount, error) => {
      // Only retry on server errors, not auth failures
      if (error.message.includes('401') || error.message.includes('403')) {
        return false; // Don't retry auth failures
      }
      return failureCount < 2; // Reduce retry attempts
    },
    retryDelay: 1000, // Fixed 1 second delay
    refetchOnWindowFocus: false, // Disable aggressive refetching
    refetchOnMount: false, // Don't refetch if data exists
    refetchOnReconnect: true, // Keep reconnect refetch
    staleTime: 10 * 60 * 1000, // 10 minutes - much longer stale time
    gcTime: 15 * 60 * 1000, // 15 minutes cache time
    // Don't throw on error - handle it in the effect
    throwOnError: false,
  });

  // Debug logging
  console.log('SellerAuth Debug:', {
    isLoading,
    error: error?.message,
    authData,
    isAuthenticated,
    seller
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: sellerLogout,
    onSuccess: () => {
      setIsAuthenticated(false);
      setSeller(null);
      localStorage.removeItem('sellerAuth');
      queryClient.invalidateQueries(['sellerAuth']);
      queryClient.clear();
      console.log('Seller logged out successfully');
      // Redirect to seller login page
      window.location.href = '/login';
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // Even if logout fails on server, clear local state
      setIsAuthenticated(false);
      setSeller(null);
      localStorage.removeItem('sellerAuth');
      window.location.href = '/login';
    }
  });

  // Update auth state when data changes
  useEffect(() => {
    if (authData && authData.user) {
      const newAuthState = {
        isAuthenticated: true,
        seller: { user: authData.user }
      };
      
      setIsAuthenticated(true);
      setSeller({ user: authData.user });
      
      // Persist to localStorage
      localStorage.setItem('sellerAuth', JSON.stringify(newAuthState));
      console.log('Seller authenticated and persisted:', authData.user.name, 'ID:', authData.user._id);
    } else if (error && !isLoading) {
      // Only clear auth state on actual authentication failures (401/403)
      if (error.message.includes('401') || error.message.includes('403')) {
        console.log('Seller authentication failed - clearing state:', error.message);
        setIsAuthenticated(false);
        setSeller(null);
        localStorage.removeItem('sellerAuth');
      } else {
        // For other errors, keep the current state and let retry handle it
        console.log('Network/server error, keeping current auth state:', error.message);
      }
    }
  }, [authData, error, isLoading]);

  // Listen for localStorage changes across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'sellerAuth') {
        if (e.newValue) {
          try {
            const newAuthState = JSON.parse(e.newValue);
            setIsAuthenticated(newAuthState.isAuthenticated);
            setSeller(newAuthState.seller);
          } catch (error) {
            console.error('Error parsing auth state from localStorage:', error);
          }
        } else {
          // Auth was cleared in another tab
          setIsAuthenticated(false);
          setSeller(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Login function to be called after successful login
  const login = (sellerData) => {
    const newAuthState = {
      isAuthenticated: true,
      seller: { user: sellerData }
    };
    
    setIsAuthenticated(true);
    setSeller({ user: sellerData });
    
    // Persist to localStorage
    localStorage.setItem('sellerAuth', JSON.stringify(newAuthState));
    
    // Update query cache
    queryClient.setQueryData(['sellerAuth'], { user: sellerData });
    console.log('Seller login state persisted:', sellerData.name, 'ID:', sellerData._id, 'Role:', sellerData.role);
  };

  // Logout function
  const logout = () => {
    logoutMutation.mutate();
  };

  // Refresh auth function to refetch user data
  const refreshAuth = () => {
    refetch();
  };

  const value = {
    isAuthenticated,
    seller,
    isLoading,
    login,
    logout,
    refreshAuth,
    isLoggingOut: logoutMutation.isPending,
    error
  };

  return (
    <SellerAuthContext.Provider value={value}>
      {children}
    </SellerAuthContext.Provider>
  );
};

// Hook to use the context
export const useSellerAuth = () => {
  const context = useContext(SellerAuthContext);
  if (context === undefined) {
    throw new Error('useSellerAuth must be used within a SellerAuthProvider');
  }
  return context;
};