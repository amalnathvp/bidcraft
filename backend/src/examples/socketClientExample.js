/**
 * Socket.io Client Integration Example for BidCraft Frontend
 * This file demonstrates how to integrate with the enhanced Socket.io server
 */

import io from 'socket.io-client';

class BidCraftSocketClient {
  constructor(token, serverUrl = 'http://localhost:5000') {
    this.socket = null;
    this.token = token;
    this.serverUrl = serverUrl;
    this.currentAuctionId = null;
    this.eventListeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Connect to Socket.io server with authentication
   */
  connect() {
    this.socket = io(this.serverUrl, {
      auth: {
        token: this.token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.setupConnectionEvents();
    this.setupAuctionEvents();
    this.setupBiddingEvents();
    this.setupNotificationEvents();
    this.setupErrorHandling();
  }

  /**
   * Setup connection-related event handlers
   */
  setupConnectionEvents() {
    this.socket.on('connect', () => {
      console.log('✅ Connected to BidCraft Socket server');
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from Socket server:', reason);
      this.emit('disconnected', reason);
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        this.handleReconnection();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🚨 Socket connection error:', error);
      this.emit('connection_error', error);
      this.handleReconnection();
    });

    // Handle heartbeat
    this.socket.on('heartbeat-ack', (data) => {
      console.log('💓 Heartbeat acknowledged at:', data.timestamp);
    });
  }

  /**
   * Setup auction-related event handlers
   */
  setupAuctionEvents() {
    // Auction room events
    this.socket.on('auction-joined', (data) => {
      console.log('🏺 Joined auction:', data.auctionTitle);
      this.emit('auction_joined', data);
    });

    this.socket.on('viewer-joined', (data) => {
      console.log('👀 New viewer joined auction:', data.userName);
      this.emit('viewer_joined', data);
    });

    this.socket.on('viewer-left', (data) => {
      console.log('👋 Viewer left auction:', data.userName);
      this.emit('viewer_left', data);
    });

    // Live auction events
    this.socket.on('live-auction-joined', (data) => {
      console.log('🔴 Joined live auction:', data.auctionTitle);
      this.emit('live_auction_joined', data);
    });

    this.socket.on('bidder-joined', (data) => {
      console.log('💰 New bidder joined:', data.bidderName);
      this.emit('bidder_joined', data);
    });

    this.socket.on('bidder-left', (data) => {
      console.log('💸 Bidder left:', data.bidderName);
      this.emit('bidder_left', data);
    });

    // Auction lifecycle events
    this.socket.on('auction-ended', (data) => {
      console.log('🏁 Auction ended:', data);
      this.emit('auction_ended', data);
    });

    this.socket.on('auction-cancelled', (data) => {
      console.log('❌ Auction cancelled:', data);
      this.emit('auction_cancelled', data);
    });

    this.socket.on('new-auction-available', (data) => {
      console.log('🆕 New auction available:', data.title);
      this.emit('new_auction_available', data);
    });
  }

  /**
   * Setup bidding-related event handlers
   */
  setupBiddingEvents() {
    // Regular bidding events
    this.socket.on('new-bid', (data) => {
      console.log('💰 New bid placed:', data);
      this.emit('new_bid', data);
    });

    this.socket.on('bid-update', (data) => {
      console.log('📈 Bid update:', data);
      this.emit('bid_update', data);
    });

    // Live auction bidding events
    this.socket.on('live-bid-update', (data) => {
      console.log('🔴 Live bid update:', data);
      this.emit('live_bid_update', data);
    });

    this.socket.on('live-auction-update', (data) => {
      console.log('🔴 Live auction update:', data);
      this.emit('live_auction_update', data);
    });

    // Bid confirmations and rejections
    this.socket.on('bid-confirmed', (data) => {
      console.log('✅ Bid confirmed:', data);
      this.emit('bid_confirmed', data);
    });

    this.socket.on('bid-rejected', (data) => {
      console.log('❌ Bid rejected:', data.message);
      this.emit('bid_rejected', data);
    });

    // Auto-bidding events
    this.socket.on('auto-bid-confirmed', (data) => {
      console.log('🤖 Auto-bid setup confirmed:', data);
      this.emit('auto_bid_confirmed', data);
    });

    this.socket.on('auto-bid-cancelled', (data) => {
      console.log('🚫 Auto-bid cancelled:', data);
      this.emit('auto_bid_cancelled', data);
    });
  }

  /**
   * Setup notification event handlers
   */
  setupNotificationEvents() {
    this.socket.on('notification', (data) => {
      console.log('🔔 Notification received:', data);
      this.emit('notification', data);
    });

    this.socket.on('new-bid-notification', (data) => {
      console.log('🔔 New bid on your auction:', data);
      this.emit('new_bid_notification', data);
    });

    this.socket.on('auction-won', (data) => {
      console.log('🎉 You won an auction!', data);
      this.emit('auction_won', data);
    });

    this.socket.on('auction-sold', (data) => {
      console.log('💰 Your auction sold:', data);
      this.emit('auction_sold', data);
    });

    this.socket.on('auction-ended-no-sale', (data) => {
      console.log('📭 Your auction ended without sale:', data);
      this.emit('auction_ended_no_sale', data);
    });

    // System notifications
    this.socket.on('system-announcement', (data) => {
      console.log('📢 System announcement:', data);
      this.emit('system_announcement', data);
    });
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    this.socket.on('error', (error) => {
      console.error('🚨 Socket error:', error);
      this.emit('error', error);
    });
  }

  /**
   * Handle reconnection logic
   */
  handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
      
      setTimeout(() => {
        this.socket.connect();
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached');
      this.emit('max_reconnect_attempts_reached');
    }
  }

  // =================
  // PUBLIC METHODS
  // =================

  /**
   * Join an auction room
   */
  joinAuction(auctionId) {
    if (this.socket && this.socket.connected) {
      this.currentAuctionId = auctionId;
      this.socket.emit('join-auction', auctionId);
      console.log('📡 Joining auction:', auctionId);
    }
  }

  /**
   * Leave current auction room
   */
  leaveAuction(auctionId = null) {
    if (this.socket && this.socket.connected) {
      const targetAuctionId = auctionId || this.currentAuctionId;
      if (targetAuctionId) {
        this.socket.emit('leave-auction', targetAuctionId);
        console.log('📡 Leaving auction:', targetAuctionId);
        if (targetAuctionId === this.currentAuctionId) {
          this.currentAuctionId = null;
        }
      }
    }
  }

  /**
   * Join a live auction room for real-time bidding
   */
  joinLiveAuction(auctionId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join-live-auction', auctionId);
      console.log('📡 Joining live auction:', auctionId);
    }
  }

  /**
   * Leave live auction room
   */
  leaveLiveAuction(auctionId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave-live-auction', auctionId);
      console.log('📡 Leaving live auction:', auctionId);
    }
  }

  /**
   * Place a bid
   */
  placeBid(auctionId, amount, bidType = 'manual') {
    if (this.socket && this.socket.connected) {
      this.socket.emit('place-bid', {
        auctionId,
        amount,
        bidType
      });
      console.log('📡 Placing bid:', { auctionId, amount, bidType });
    }
  }

  /**
   * Setup auto-bidding
   */
  setupAutoBid(auctionId, maxAmount) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('setup-auto-bid', {
        auctionId,
        maxAmount
      });
      console.log('📡 Setting up auto-bid:', { auctionId, maxAmount });
    }
  }

  /**
   * Cancel auto-bidding
   */
  cancelAutoBid(auctionId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('cancel-auto-bid', auctionId);
      console.log('📡 Cancelling auto-bid:', auctionId);
    }
  }

  /**
   * Send heartbeat
   */
  sendHeartbeat() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('heartbeat');
    }
  }

  /**
   * Mark notification as read
   */
  markNotificationRead(notificationId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('mark-notification-read', notificationId);
    }
  }

  /**
   * Join order chat
   */
  joinOrderChat(orderId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join-order-chat', orderId);
      console.log('📡 Joining order chat:', orderId);
    }
  }

  /**
   * Send message in order chat
   */
  sendOrderMessage(orderId, message) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('send-order-message', {
        orderId,
        message
      });
    }
  }

  /**
   * Ask question about auction
   */
  askQuestion(auctionId, question) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('ask-question', {
        auctionId,
        question
      });
    }
  }

  // =================
  // EVENT MANAGEMENT
  // =================

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to local listeners
   */
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentAuctionId = null;
      console.log('🔌 Disconnected from BidCraft Socket server');
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.socket && this.socket.connected;
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected(),
      currentAuctionId: this.currentAuctionId,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// =================
// USAGE EXAMPLES
// =================

/**
 * Example usage in React component
 */
export const useSocketExample = () => {
  const [socketClient, setSocketClient] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Initialize socket client with auth token
    const token = localStorage.getItem('authToken');
    if (token) {
      const client = new BidCraftSocketClient(token);
      
      // Setup event listeners
      client.on('connected', () => {
        setConnected(true);
        console.log('Connected to BidCraft');
      });

      client.on('disconnected', () => {
        setConnected(false);
        console.log('Disconnected from BidCraft');
      });

      client.on('new_bid', (data) => {
        // Update auction display with new bid
        console.log('New bid received:', data);
      });

      client.on('notification', (data) => {
        // Add notification to UI
        setNotifications(prev => [data, ...prev]);
      });

      client.on('auction_won', (data) => {
        // Show congratulations modal
        alert(`Congratulations! You won ${data.auctionTitle} for $${data.winningAmount}`);
      });

      // Connect to server
      client.connect();
      setSocketClient(client);

      // Cleanup on unmount
      return () => {
        client.disconnect();
      };
    }
  }, []);

  // Methods to use in components
  const joinAuction = (auctionId) => {
    if (socketClient) {
      socketClient.joinAuction(auctionId);
    }
  };

  const placeBid = (auctionId, amount) => {
    if (socketClient) {
      socketClient.placeBid(auctionId, amount);
    }
  };

  return {
    connected,
    notifications,
    joinAuction,
    placeBid,
    socketClient
  };
};

export default BidCraftSocketClient;
