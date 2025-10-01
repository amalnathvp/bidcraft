import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Create the context
const BuyerAuthContext = createContext();

// API functions
const checkBuyerAuth = async () => {
  try {
    const response = await fetch('/buyer/profile', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.log('Buyer auth check failed - unauthorized:', response.status);
        throw new Error(`Authentication failed: ${response.status}`);
      }
      console.log('Buyer auth check - server error, will retry:', response.status);
      throw new Error(`Server error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Buyer auth check success:', data);
    return data;
  } catch (error) {
    console.log('Buyer auth check error:', error);
    throw error;
  }
};

const buyerLogout = async () => {
  const response = await fetch('/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Logout failed');
  }
  
  return response.json();
};

export const useBuyerAuth = () => {
  const context = useContext(BuyerAuthContext);
  if (!context) {
    throw new Error('useBuyerAuth must be used within a BuyerAuthProvider');
  }
  return context;
};

export const BuyerAuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  
  // Initialize state from localStorage for persistence
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const savedAuth = localStorage.getItem('buyerAuth');
      return savedAuth ? JSON.parse(savedAuth).isAuthenticated : false;
    } catch {
      return false;
    }
  });
  
  const [buyer, setBuyer] = useState(() => {
    try {
      const savedAuth = localStorage.getItem('buyerAuth');
      return savedAuth ? JSON.parse(savedAuth).buyer : null;
    } catch {
      return null;
    }
  });

  // Query to check authentication status
  const { data: authData, isLoading, error, refetch } = useQuery({
    queryKey: ['buyerAuth'],
    queryFn: checkBuyerAuth,
    retry: (failureCount, error) => {
      if (error.message.includes('401') || error.message.includes('403')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    throwOnError: false,
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: buyerLogout,
    onSuccess: () => {
      setIsAuthenticated(false);
      setBuyer(null);
      localStorage.removeItem('buyerAuth');
      queryClient.invalidateQueries(['buyerAuth']);
      queryClient.clear();
      console.log('Buyer logged out successfully');
      window.location.href = '/';
    },
    onError: (error) => {
      console.error('Logout error:', error);
      setIsAuthenticated(false);
      setBuyer(null);
      localStorage.removeItem('buyerAuth');
      window.location.href = '/';
    }
  });

  // Update auth state when data changes
  useEffect(() => {
    if (authData && authData.buyer) {
      const newAuthState = {
        isAuthenticated: true,
        buyer: authData.buyer
      };
      
      setIsAuthenticated(true);
      setBuyer(authData.buyer);
      localStorage.setItem('buyerAuth', JSON.stringify(newAuthState));
      console.log('Buyer authenticated and persisted:', authData.buyer.name);
    } else if (error && !isLoading) {
      if (error.message.includes('401') || error.message.includes('403')) {
        console.log('Buyer authentication failed - clearing state:', error.message);
        setIsAuthenticated(false);
        setBuyer(null);
        localStorage.removeItem('buyerAuth');
      } else {
        console.log('Network/server error, keeping current auth state:', error.message);
      }
    }
  }, [authData, error, isLoading]);

  // Listen for localStorage changes across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'buyerAuth') {
        if (e.newValue) {
          try {
            const newAuthState = JSON.parse(e.newValue);
            setIsAuthenticated(newAuthState.isAuthenticated);
            setBuyer(newAuthState.buyer);
          } catch (error) {
            console.error('Error parsing auth state from localStorage:', error);
          }
        } else {
          setIsAuthenticated(false);
          setBuyer(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Login function to be called after successful login
  const login = (buyerData) => {
    const newAuthState = {
      isAuthenticated: true,
      buyer: buyerData
    };
    
    setIsAuthenticated(true);
    setBuyer(buyerData);
    localStorage.setItem('buyerAuth', JSON.stringify(newAuthState));
    queryClient.setQueryData(['buyerAuth'], { buyer: buyerData });
    console.log('Buyer login state persisted:', buyerData.name);
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
    buyer,
    isLoading,
    login,
    logout,
    refreshAuth,
    isLoggingOut: logoutMutation.isPending,
    error
  };

  return (
    <BuyerAuthContext.Provider value={value}>
      {children}
    </BuyerAuthContext.Provider>
  );
};
