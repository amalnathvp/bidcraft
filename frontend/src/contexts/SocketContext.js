import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [activeAuctions, setActiveAuctions] = useState(new Set());
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Only connect if user is authenticated
    if (isAuthenticated) {
      const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setConnected(true);
        setSocket(newSocket);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
      });

      // Handle bid updates
      newSocket.on('bid-update', (data) => {
        console.log('Bid update received:', data);
        
        // Show toast notification for new bids
        if (data.bid && data.message) {
          if (data.bid.bidder._id !== user?.id) {
            // Show notification only if it's not the current user's bid
            toast.info(data.message, {
              autoClose: 3000,
              hideProgressBar: true
            });
          }
        }

        // Trigger custom event for components to listen to
        window.dispatchEvent(new CustomEvent('bid-update', {
          detail: data
        }));
      });

      // Cleanup on unmount
      return () => {
        newSocket.close();
      };
    } else {
      // Disconnect socket if user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
        setActiveAuctions(new Set());
      }
    }
  }, [isAuthenticated, user?.id]);

  // Join auction room
  const joinAuction = (productId) => {
    if (socket && connected) {
      socket.emit('join-auction', productId);
      setActiveAuctions(prev => new Set([...prev, productId]));
      console.log('Joined auction room for product:', productId);
    }
  };

  // Leave auction room
  const leaveAuction = (productId) => {
    if (socket && connected) {
      socket.emit('leave-auction', productId);
      setActiveAuctions(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
      console.log('Left auction room for product:', productId);
    }
  };

  // Leave all auction rooms
  const leaveAllAuctions = () => {
    if (socket && connected) {
      activeAuctions.forEach(productId => {
        socket.emit('leave-auction', productId);
      });
      setActiveAuctions(new Set());
      console.log('Left all auction rooms');
    }
  };

  // Emit new bid
  const emitBid = (bidData) => {
    if (socket && connected) {
      socket.emit('new-bid', bidData);
      console.log('Bid emitted:', bidData);
    }
  };

  // Subscribe to bid updates for a specific product
  const subscribeToBidUpdates = (callback) => {
    const handleBidUpdate = (event) => {
      callback(event.detail);
    };

    window.addEventListener('bid-update', handleBidUpdate);

    // Return cleanup function
    return () => {
      window.removeEventListener('bid-update', handleBidUpdate);
    };
  };

  const value = {
    socket,
    connected,
    activeAuctions: Array.from(activeAuctions),
    joinAuction,
    leaveAuction,
    leaveAllAuctions,
    emitBid,
    subscribeToBidUpdates
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;