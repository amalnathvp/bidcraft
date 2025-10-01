import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Create the context
const SellerAuthContext = createContext();

// API functions
const checkSellerAuth = async () => {
  try {
    const response = await fetch('/api/user', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Seller auth check failed:', response.status, errorText);
      throw new Error(`Authentication failed: ${response.status}`);
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
  const response = await fetch('/api/auth/logout', {
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [seller, setSeller] = useState(null);

  // Query to check authentication status
  const { data: authData, isLoading, error } = useQuery({
    queryKey: ['sellerAuth'],
    queryFn: checkSellerAuth,
    retry: 2, // Increase retry attempts
    retryDelay: 1000, // 1 second delay between retries
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes for better persistence
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: sellerLogout,
    onSuccess: () => {
      setIsAuthenticated(false);
      setSeller(null);
      queryClient.invalidateQueries(['sellerAuth']);
      // Redirect to seller login page
      window.location.href = '/login';
    },
    onError: (error) => {
      console.error('Logout error:', error);
    }
  });

  // Update auth state when data changes
  useEffect(() => {
    if (authData && authData.user) {
      setIsAuthenticated(true);
      // Store the complete user object with nested structure for compatibility
      setSeller({ user: authData.user });
      console.log('Seller authenticated:', authData.user.name);
    } else if (error && !isLoading) {
      // Only clear auth state if we're sure there's an error and not still loading
      console.log('Seller authentication error:', error.message);
      setIsAuthenticated(false);
      setSeller(null);
    }
  }, [authData, error, isLoading]);

  // Login function to be called after successful login
  const login = (sellerData) => {
    setIsAuthenticated(true);
    setSeller({ user: sellerData });
    queryClient.setQueryData(['sellerAuth'], { user: sellerData });
  };

  // Logout function
  const logout = () => {
    logoutMutation.mutate();
  };

  const value = {
    isAuthenticated,
    seller,
    isLoading,
    login,
    logout,
    isLoggingOut: logoutMutation.isPending
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