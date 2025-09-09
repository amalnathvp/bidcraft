import { useEffect, useState, useCallback, useRef } from 'react';
import { socketService, BidEvent, AuctionRoomEvent, LiveAuctionEvent, NotificationEvent, AuctionEndedEvent } from '../services/socketService';
import { authService } from '../services/auth';

// Custom hook for socket connection management
export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const connectionRef = useRef<boolean>(false);

  useEffect(() => {
    const initializeSocket = async () => {
      // Only connect if user is authenticated and not already connected
      if (authService.isAuthenticated() && !connectionRef.current) {
        console.log('🔌 useSocket: Initializing socket connection');
        connectionRef.current = true;
        
        const connected = await socketService.connect();
        if (connected) {
          setIsConnected(true);
          setConnectionError(null);
          setReconnectAttempts(0);
        } else {
          setConnectionError('Failed to connect to real-time system');
        }
      }
    };

    // Set up socket event listeners
    const handleConnected = () => {
      console.log('✅ useSocket: Connected to real-time system');
      setIsConnected(true);
      setConnectionError(null);
      setReconnectAttempts(0);
    };

    const handleDisconnected = (reason: string) => {
      console.log('🔌 useSocket: Disconnected:', reason);
      setIsConnected(false);
      connectionRef.current = false;
    };

    const handleConnectionError = (error: any) => {
      console.error('❌ useSocket: Connection error:', error);
      setConnectionError(error.message || 'Connection failed');
      setIsConnected(false);
      connectionRef.current = false;
    };

    const handleReconnectionFailed = () => {
      console.error('💥 useSocket: Reconnection failed');
      setConnectionError('Failed to reconnect to real-time system');
      connectionRef.current = false;
    };

    // Add event listeners
    socketService.on('connected', handleConnected);
    socketService.on('disconnected', handleDisconnected);
    socketService.on('connection_error', handleConnectionError);
    socketService.on('reconnection_failed', handleReconnectionFailed);

    // Initialize connection
    initializeSocket();

    // Cleanup on unmount
    return () => {
      socketService.off('connected', handleConnected);
      socketService.off('disconnected', handleDisconnected);
      socketService.off('connection_error', handleConnectionError);
      socketService.off('reconnection_failed', handleReconnectionFailed);
    };
  }, []);

  const connect = useCallback(async () => {
    if (!connectionRef.current) {
      connectionRef.current = true;
      const connected = await socketService.connect();
      if (!connected) {
        connectionRef.current = false;
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    socketService.disconnect();
    setIsConnected(false);
    connectionRef.current = false;
  }, []);

  return {
    isConnected,
    connectionError,
    reconnectAttempts,
    connect,
    disconnect,
    socket: socketService
  };
};

// Custom hook for auction room management
export const useAuctionRoom = (auctionId: string | null) => {
  const { isConnected, socket } = useSocket();
  const [viewerCount, setViewerCount] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [isInRoom, setIsInRoom] = useState(false);
  const currentAuctionRef = useRef<string | null>(null);

  // Join/leave auction room when auctionId changes
  useEffect(() => {
    if (!isConnected || !auctionId) return;

    // Leave previous room if any
    if (currentAuctionRef.current && currentAuctionRef.current !== auctionId) {
      socket.leaveAuction(currentAuctionRef.current);
      setIsInRoom(false);
    }

    // Join new room
    if (auctionId) {
      console.log('🚪 useAuctionRoom: Joining auction room:', auctionId);
      socket.joinAuction(auctionId);
      currentAuctionRef.current = auctionId;
    }

    // Cleanup on unmount or auctionId change
    return () => {
      if (currentAuctionRef.current) {
        socket.leaveAuction(currentAuctionRef.current);
        setIsInRoom(false);
      }
    };
  }, [isConnected, auctionId, socket]);

  // Set up auction room event listeners
  useEffect(() => {
    const handleAuctionJoined = (data: AuctionRoomEvent) => {
      if (data.auctionId === auctionId) {
        console.log('✅ useAuctionRoom: Successfully joined auction room');
        setIsInRoom(true);
        setViewerCount(data.viewerCount);
        setCurrentPrice(data.currentPrice);
      }
    };

    const handleViewerJoined = (data: any) => {
      setViewerCount(data.viewerCount);
    };

    const handleViewerLeft = (data: any) => {
      setViewerCount(data.userCount);
    };

    socket.on('auction-joined', handleAuctionJoined);
    socket.on('viewer-joined', handleViewerJoined);
    socket.on('viewer-left', handleViewerLeft);

    return () => {
      socket.off('auction-joined', handleAuctionJoined);
      socket.off('viewer-joined', handleViewerJoined);
      socket.off('viewer-left', handleViewerLeft);
    };
  }, [auctionId, socket]);

  return {
    isInRoom,
    viewerCount,
    currentPrice,
    joinAuction: useCallback((id: string) => {
      if (isConnected) {
        socket.joinAuction(id);
      }
    }, [isConnected, socket]),
    leaveAuction: useCallback((id: string) => {
      if (isConnected) {
        socket.leaveAuction(id);
      }
    }, [isConnected, socket])
  };
};

// Custom hook for live bidding
export const useLiveBidding = (auctionId: string | null) => {
  const { isConnected, socket } = useSocket();
  const [recentBids, setRecentBids] = useState<BidEvent[]>([]);
  const [currentBid, setCurrentBid] = useState<number>(0);
  const [totalBids, setTotalBids] = useState<number>(0);
  const [leadingBidder, setLeadingBidder] = useState<{ id: string; name: string } | null>(null);
  const [isInLiveRoom, setIsInLiveRoom] = useState(false);
  const [bidStatus, setBidStatus] = useState<'idle' | 'placing' | 'confirmed' | 'rejected'>('idle');
  const [bidError, setBidError] = useState<string | null>(null);
  const currentLiveAuctionRef = useRef<string | null>(null);

  // Join/leave live auction room
  useEffect(() => {
    if (!isConnected || !auctionId) return;

    // Leave previous live room if any
    if (currentLiveAuctionRef.current && currentLiveAuctionRef.current !== auctionId) {
      socket.leaveLiveAuction(currentLiveAuctionRef.current);
      setIsInLiveRoom(false);
    }

    // Join new live room
    if (auctionId) {
      console.log('🔴 useLiveBidding: Joining live auction room:', auctionId);
      socket.joinLiveAuction(auctionId);
      currentLiveAuctionRef.current = auctionId;
    }

    return () => {
      if (currentLiveAuctionRef.current) {
        socket.leaveLiveAuction(currentLiveAuctionRef.current);
        setIsInLiveRoom(false);
      }
    };
  }, [isConnected, auctionId, socket]);

  // Set up live bidding event listeners
  useEffect(() => {
    const handleLiveAuctionJoined = (data: any) => {
      if (data.auctionId === auctionId) {
        console.log('✅ useLiveBidding: Successfully joined live auction room');
        setIsInLiveRoom(true);
        setCurrentBid(data.currentPrice);
        setTotalBids(data.totalBids);
        setRecentBids(data.recentBids || []);
      }
    };

    const handleNewBid = (data: BidEvent) => {
      if (data.auctionId === auctionId) {
        console.log('💰 useLiveBidding: New bid received:', data);
        setRecentBids(prev => [data, ...prev.slice(0, 9)]); // Keep last 10 bids
        setCurrentBid(data.amount);
        setTotalBids(prev => prev + 1);
      }
    };

    const handleLiveBidUpdate = (data: LiveAuctionEvent) => {
      if (data.auctionId === auctionId) {
        console.log('🚀 useLiveBidding: Live bid update:', data);
        if (data.newCurrentPrice) setCurrentBid(data.newCurrentPrice);
        if (data.totalBids) setTotalBids(data.totalBids);
        if (data.leadingBidder) setLeadingBidder(data.leadingBidder);
      }
    };

    const handleBidConfirmed = (data: any) => {
      console.log('✅ useLiveBidding: Bid confirmed:', data);
      setBidStatus('confirmed');
      setBidError(null);
      setTimeout(() => setBidStatus('idle'), 3000);
    };

    const handleBidRejected = (data: any) => {
      console.log('❌ useLiveBidding: Bid rejected:', data);
      setBidStatus('rejected');
      setBidError(data.message);
      setTimeout(() => {
        setBidStatus('idle');
        setBidError(null);
      }, 5000);
    };

    socket.on('live-auction-joined', handleLiveAuctionJoined);
    socket.on('new-bid', handleNewBid);
    socket.on('live-bid-update', handleLiveBidUpdate);
    socket.on('bid-confirmed', handleBidConfirmed);
    socket.on('bid-rejected', handleBidRejected);

    return () => {
      socket.off('live-auction-joined', handleLiveAuctionJoined);
      socket.off('new-bid', handleNewBid);
      socket.off('live-bid-update', handleLiveBidUpdate);
      socket.off('bid-confirmed', handleBidConfirmed);
      socket.off('bid-rejected', handleBidRejected);
    };
  }, [auctionId, socket]);

  const placeBid = useCallback((amount: number, bidType: 'manual' | 'automatic' | 'buy_now' = 'manual') => {
    if (!isConnected || !auctionId || bidStatus === 'placing') return;

    console.log('💰 useLiveBidding: Placing bid:', { auctionId, amount, bidType });
    setBidStatus('placing');
    setBidError(null);
    socket.placeBid(auctionId, amount, bidType);
  }, [isConnected, auctionId, bidStatus, socket]);

  const setupAutoBid = useCallback((maxAmount: number) => {
    if (!isConnected || !auctionId) return;

    console.log('🤖 useLiveBidding: Setting up auto-bid:', { auctionId, maxAmount });
    socket.setupAutoBid(auctionId, maxAmount);
  }, [isConnected, auctionId, socket]);

  const cancelAutoBid = useCallback(() => {
    if (!isConnected || !auctionId) return;

    console.log('🤖 useLiveBidding: Cancelling auto-bid for:', auctionId);
    socket.cancelAutoBid(auctionId);
  }, [isConnected, auctionId, socket]);

  return {
    isInLiveRoom,
    recentBids,
    currentBid,
    totalBids,
    leadingBidder,
    bidStatus,
    bidError,
    placeBid,
    setupAutoBid,
    cancelAutoBid
  };
};

// Custom hook for notifications
export const useNotifications = () => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleNotification = (data: NotificationEvent) => {
      console.log('🔔 useNotifications: New notification:', data);
      setNotifications(prev => [data, ...prev.slice(0, 49)]); // Keep last 50 notifications
      setUnreadCount(prev => prev + 1);
    };

    const handleAuctionWon = (data: any) => {
      console.log('🏆 useNotifications: Auction won:', data);
      const notification: NotificationEvent = {
        type: 'success',
        title: 'Auction Won!',
        message: `Congratulations! You won "${data.auctionTitle}" for $${data.winningAmount}`,
        timestamp: new Date().toISOString()
      };
      handleNotification(notification);
    };

    const handleAuctionSold = (data: any) => {
      console.log('💵 useNotifications: Auction sold:', data);
      const notification: NotificationEvent = {
        type: 'success',
        title: 'Auction Sold!',
        message: `Your auction "${data.auctionTitle}" sold for $${data.finalPrice}`,
        timestamp: new Date().toISOString()
      };
      handleNotification(notification);
    };

    const handleAuctionEnded = (data: AuctionEndedEvent) => {
      console.log('🏁 useNotifications: Auction ended:', data);
      const notification: NotificationEvent = {
        type: 'info',
        title: 'Auction Ended',
        message: data.winner 
          ? `"${data.auctionTitle}" ended. Winner: ${data.winner.name} ($${data.finalPrice})`
          : `"${data.auctionTitle}" ended with no winner`,
        timestamp: new Date().toISOString()
      };
      handleNotification(notification);
    };

    const handleSystemAnnouncement = (data: any) => {
      console.log('📢 useNotifications: System announcement:', data);
      const notification: NotificationEvent = {
        type: data.type === 'maintenance' ? 'warning' : 'info',
        title: data.title,
        message: data.message,
        timestamp: data.timestamp
      };
      handleNotification(notification);
    };

    socket.on('notification', handleNotification);
    socket.on('auction-won', handleAuctionWon);
    socket.on('auction-sold', handleAuctionSold);
    socket.on('auction-ended', handleAuctionEnded);
    socket.on('system-announcement', handleSystemAnnouncement);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('auction-won', handleAuctionWon);
      socket.off('auction-sold', handleAuctionSold);
      socket.off('auction-ended', handleAuctionEnded);
      socket.off('system-announcement', handleSystemAnnouncement);
    };
  }, [socket]);

  const markAsRead = useCallback((index: number) => {
    setNotifications(prev => prev.map((notification, i) => 
      i === index ? { ...notification, read: true } : notification
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };
};

// Export all hooks
export default {
  useSocket,
  useAuctionRoom,
  useLiveBidding,
  useNotifications
};
