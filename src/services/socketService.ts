import { io, Socket } from 'socket.io-client';
import { authService } from './auth';

// Define types for socket events
export interface BidEvent {
  auctionId: string;
  amount: number;
  bidder: {
    id: string;
    name: string;
  };
  bidTime: string;
  bidType: 'manual' | 'automatic' | 'buy_now';
}

export interface AuctionRoomEvent {
  auctionId: string;
  auctionTitle: string;
  viewerCount: number;
  currentPrice: number;
  status: string;
}

export interface LiveAuctionEvent {
  auctionId: string;
  eventType: 'new-bid' | 'auction-ended' | 'auction-cancelled';
  newCurrentPrice?: number;
  totalBids?: number;
  leadingBidder?: {
    id: string;
    name: string;
  };
  bidTime?: string;
}

export interface NotificationEvent {
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: string;
}

export interface AuctionEndedEvent {
  auctionId: string;
  winner?: {
    id: string;
    name: string;
  };
  finalPrice: number;
  endType: 'time_expired' | 'buy_now' | 'no_reserve_met';
  auctionTitle: string;
}

// Real-time bidding service class
class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private eventListeners: Map<string, Function[]> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private joinedRooms: Set<string> = new Set();

  constructor() {
    console.log('🔌 SocketService: Initializing real-time bidding system');
  }

  // Initialize socket connection with authentication
  async connect(): Promise<boolean> {
    try {
      // Check if user is authenticated
      if (!authService.isAuthenticated()) {
        console.error('🔐 SocketService: User not authenticated');
        return false;
      }

      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('🔐 SocketService: No authentication token available');
        return false;
      }

      const user = authService.getCurrentUserFromStorage();
      if (!user) {
        console.error('👤 SocketService: No current user available');
        return false;
      }

      console.log('🚀 SocketService: Connecting to backend with user:', user.name);

      // Initialize socket connection with authentication
      this.socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      // Set up connection event handlers
      this.setupConnectionHandlers();
      
      // Set up auction event handlers
      this.setupAuctionHandlers();
      
      // Set up bidding event handlers
      this.setupBiddingHandlers();
      
      // Set up notification handlers
      this.setupNotificationHandlers();

      return new Promise((resolve) => {
        this.socket!.on('connect', () => {
          console.log('✅ SocketService: Connected to real-time bidding system');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve(true);
        });

        this.socket!.on('connect_error', (error: any) => {
          console.error('❌ SocketService: Connection failed:', error.message);
          this.isConnected = false;
          this.emit('connection_error', error);
          resolve(false);
        });

        // Set connection timeout
        setTimeout(() => {
          if (!this.isConnected) {
            console.warn('⏰ SocketService: Connection timeout');
            resolve(false);
          }
        }, 10000);
      });
    } catch (error) {
      console.error('💥 SocketService: Error during connection:', error);
      return false;
    }
  }

  // Setup connection event handlers
  private setupConnectionHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connected', () => {
      console.log('🎉 SocketService: Successfully connected to bidding system');
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason: any) => {
      console.log('🔌 SocketService: Disconnected from bidding system:', reason);
      this.isConnected = false;
      this.emit('disconnected', reason);
      
      // Attempt reconnection for certain disconnect reasons
      if (reason === 'io server disconnect' || reason === 'transport close') {
        this.attemptReconnection();
      }
    });

    this.socket.on('error', (error: any) => {
      console.error('🚨 SocketService: Socket error:', error);
      this.emit('error', error);
    });

    this.socket.on('heartbeat-ack', (data: any) => {
      console.log('💓 SocketService: Heartbeat acknowledged');
      this.emit('heartbeat', data);
    });
  }

  // Setup auction room event handlers
  private setupAuctionHandlers(): void {
    if (!this.socket) return;

    // Auction room events
    this.socket.on('auction-joined', (data: AuctionRoomEvent) => {
      console.log('🏠 SocketService: Successfully joined auction room:', data.auctionId);
      this.emit('auction-joined', data);
    });

    this.socket.on('live-auction-joined', (data: any) => {
      console.log('🔴 SocketService: Successfully joined live auction room:', data.auctionId);
      this.emit('live-auction-joined', data);
    });

    this.socket.on('viewer-joined', (data: any) => {
      console.log('👥 SocketService: New viewer joined auction:', data);
      this.emit('viewer-joined', data);
    });

    this.socket.on('viewer-left', (data: any) => {
      console.log('👋 SocketService: Viewer left auction:', data);
      this.emit('viewer-left', data);
    });

    // Auction lifecycle events
    this.socket.on('auction-ended', (data: AuctionEndedEvent) => {
      console.log('🏁 SocketService: Auction ended:', data);
      this.emit('auction-ended', data);
    });

    this.socket.on('auction-cancelled', (data: any) => {
      console.log('❌ SocketService: Auction cancelled:', data);
      this.emit('auction-cancelled', data);
    });

    this.socket.on('new-auction-available', (data: any) => {
      console.log('🆕 SocketService: New auction available:', data);
      this.emit('new-auction-available', data);
    });
  }

  // Setup bidding event handlers
  private setupBiddingHandlers(): void {
    if (!this.socket) return;

    // Bidding events
    this.socket.on('new-bid', (data: BidEvent) => {
      console.log('💰 SocketService: New bid placed:', data);
      this.emit('new-bid', data);
    });

    this.socket.on('live-bid-update', (data: LiveAuctionEvent) => {
      console.log('🚀 SocketService: Live bid update:', data);
      this.emit('live-bid-update', data);
    });

    this.socket.on('bid-confirmed', (data: any) => {
      console.log('✅ SocketService: Bid confirmed:', data);
      this.emit('bid-confirmed', data);
    });

    this.socket.on('bid-rejected', (data: any) => {
      console.log('❌ SocketService: Bid rejected:', data);
      this.emit('bid-rejected', data);
    });

    // Auto-bidding events
    this.socket.on('auto-bid-triggered', (data: any) => {
      console.log('🤖 SocketService: Auto-bid triggered:', data);
      this.emit('auto-bid-triggered', data);
    });
  }

  // Setup notification handlers
  private setupNotificationHandlers(): void {
    if (!this.socket) return;

    this.socket.on('notification', (data: NotificationEvent) => {
      console.log('🔔 SocketService: Notification received:', data);
      this.emit('notification', data);
    });

    this.socket.on('auction-won', (data: any) => {
      console.log('🏆 SocketService: Auction won:', data);
      this.emit('auction-won', data);
    });

    this.socket.on('auction-sold', (data: any) => {
      console.log('💵 SocketService: Auction sold:', data);
      this.emit('auction-sold', data);
    });

    this.socket.on('system-announcement', (data: any) => {
      console.log('📢 SocketService: System announcement:', data);
      this.emit('system-announcement', data);
    });
  }

  // Join auction room for general updates
  joinAuction(auctionId: string): void {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ SocketService: Cannot join auction - not connected');
      return;
    }

    console.log('🚪 SocketService: Joining auction room:', auctionId);
    this.socket.emit('join-auction', auctionId);
    this.joinedRooms.add(`auction-${auctionId}`);
  }

  // Leave auction room
  leaveAuction(auctionId: string): void {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ SocketService: Cannot leave auction - not connected');
      return;
    }

    console.log('🚪 SocketService: Leaving auction room:', auctionId);
    this.socket.emit('leave-auction', auctionId);
    this.joinedRooms.delete(`auction-${auctionId}`);
  }

  // Join live auction room for real-time bidding
  joinLiveAuction(auctionId: string): void {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ SocketService: Cannot join live auction - not connected');
      return;
    }

    console.log('🔴 SocketService: Joining live auction room:', auctionId);
    this.socket.emit('join-live-auction', auctionId);
    this.joinedRooms.add(`live-auction-${auctionId}`);
  }

  // Leave live auction room
  leaveLiveAuction(auctionId: string): void {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ SocketService: Cannot leave live auction - not connected');
      return;
    }

    console.log('🔴 SocketService: Leaving live auction room:', auctionId);
    this.socket.emit('leave-live-auction', auctionId);
    this.joinedRooms.delete(`live-auction-${auctionId}`);
  }

  // Place a bid
  placeBid(auctionId: string, amount: number, bidType: 'manual' | 'automatic' | 'buy_now' = 'manual'): void {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ SocketService: Cannot place bid - not connected');
      return;
    }

    const bidData = {
      auctionId,
      amount,
      bidType
    };

    console.log('💰 SocketService: Placing bid:', bidData);
    this.socket.emit('place-bid', bidData);
  }

  // Setup auto-bidding
  setupAutoBid(auctionId: string, maxAmount: number): void {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ SocketService: Cannot setup auto-bid - not connected');
      return;
    }

    console.log('🤖 SocketService: Setting up auto-bid:', { auctionId, maxAmount });
    this.socket.emit('setup-auto-bid', { auctionId, maxAmount });
  }

  // Cancel auto-bidding
  cancelAutoBid(auctionId: string): void {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ SocketService: Cannot cancel auto-bid - not connected');
      return;
    }

    console.log('🤖 SocketService: Cancelling auto-bid for auction:', auctionId);
    this.socket.emit('cancel-auto-bid', auctionId);
  }

  // Event listener management
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function): void {
    if (!this.eventListeners.has(event)) return;

    if (callback) {
      const listeners = this.eventListeners.get(event)!;
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    } else {
      this.eventListeners.delete(event);
    }
  }

  private emit(event: string, data?: any): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)!.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('🚨 SocketService: Error in event callback:', error);
        }
      });
    }
  }

  // Reconnection logic
  private attemptReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('💥 SocketService: Max reconnection attempts reached');
      this.emit('reconnection_failed');
      return;
    }

    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(`🔄 SocketService: Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect();
      }
    }, delay);
  }

  // Disconnect from socket
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 SocketService: Disconnecting from bidding system');
      
      // Leave all joined rooms
      this.joinedRooms.forEach(room => {
        if (room.startsWith('auction-')) {
          this.leaveAuction(room.replace('auction-', ''));
        } else if (room.startsWith('live-auction-')) {
          this.leaveLiveAuction(room.replace('live-auction-', ''));
        }
      });

      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.joinedRooms.clear();
      this.eventListeners.clear();
    }
  }

  // Get connection status
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Get joined rooms
  getJoinedRooms(): string[] {
    return Array.from(this.joinedRooms);
  }

  // Mark notification as read
  markNotificationRead(notificationId: string): void {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('mark-notification-read', notificationId);
  }

  // Send heartbeat to server
  sendHeartbeat(): void {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('heartbeat', { timestamp: new Date().toISOString() });
  }
}

// Create and export singleton instance
export const socketService = new SocketService();

// Export default for easy importing
export default socketService;
