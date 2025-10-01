import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Create the context
const BuyerAuthContext = createContext();

// API functions
const checkBuyerAuth = async () => {
  const response = await fetch('/api/buyer/profile', {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Not authenticated');
  }
  
  return response.json();
};

const buyerLogout = async () => {
  const response = await fetch('/api/buyer/logout', {
    method: 'POST',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Logout failed');
  }
  
  return response.json();
};

// Provider component
export const BuyerAuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [buyer, setBuyer] = useState(null);

  // Query to check authentication status
  const { data: authData, isLoading, error } = useQuery({
    queryKey: ['buyerAuth'],
    queryFn: checkBuyerAuth,
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: buyerLogout,
    onSuccess: () => {
      setIsAuthenticated(false);
      setBuyer(null);
      queryClient.invalidateQueries(['buyerAuth']);
      // Redirect to home page
      window.location.href = '/';
    },
    onError: (error) => {
      console.error('Logout error:', error);
    }
  });

  // Update auth state when data changes
  useEffect(() => {
    if (authData && authData.buyer) {
      setIsAuthenticated(true);
      setBuyer(authData.buyer);
    } else if (error) {
      setIsAuthenticated(false);
      setBuyer(null);
    }
  }, [authData, error]);

  // Login function to be called after successful login
  const login = (buyerData) => {
    setIsAuthenticated(true);
    setBuyer(buyerData);
    queryClient.setQueryData(['buyerAuth'], { buyer: buyerData });
  };

  // Logout function
  const logout = () => {
    logoutMutation.mutate();
  };

  const value = {
    isAuthenticated,
    buyer,
    isLoading,
    login,
    logout,
    isLoggingOut: logoutMutation.isPending
  };

  return (
    <BuyerAuthContext.Provider value={value}>
      {children}
    </BuyerAuthContext.Provider>
  );
};

// Hook to use the context
export const useBuyerAuth = () => {
  const context = useContext(BuyerAuthContext);
  if (context === undefined) {
    throw new Error('useBuyerAuth must be used within a BuyerAuthProvider');
  }
  return context;
};