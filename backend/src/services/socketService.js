const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');

/**
 * Socket.io Service for Real-time Auction Updates
 * Handles room-based communications, bidding, notifications, and live auction management
 */
class SocketService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // Track connected users
    this.auctionRooms = new Map(); // Track active auction rooms
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  /**
   * Setup Socket.io middleware for authentication and logging
   */
  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || 
                     socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          console.log('❌ Socket connection rejected: No token provided');
          return next(new Error('Authentication token required'));
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user || !user.isActive) {
          console.log('❌ Socket connection rejected: User not found or inactive');
          return next(new Error('User not found or inactive'));
        }
        
        socket.user = user;
        console.log(`✅ Socket authenticated: ${user.name} (${user.role})`);
        next();
      } catch (error) {
        console.log('❌ Socket authentication failed:', error.message);
        next(new Error('Invalid authentication token'));
      }
    });

    // Logging middleware
    this.io.use((socket, next) => {
      socket.onAny((eventName, ...args) => {
        console.log(`📡 Socket Event: ${eventName} from ${socket.user?.name || 'Unknown'}`);
      });
      next();
    });
  }

  /**
   * Setup all Socket.io event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new socket connection
   */
  handleConnection(socket) {
    const user = socket.user;
    console.log(`🔌 User connected: ${user.name} (${user.role}) - Socket: ${socket.id}`);
    
    // Track connected user
    this.connectedUsers.set(socket.id, {
      userId: user._id.toString(),
      userName: user.name,
      userRole: user.role,
      connectedAt: new Date()
    });

    // Join user to their personal notification room
    socket.join(`user-${user._id}`);
    
    // Join role-based rooms
    socket.join(`role-${user.role}`);
    
    // Admin users join admin room
    if (user.role === 'admin') {
      socket.join('admin-room');
      this.emitToAdmins('admin-user-connected', { userName: user.name });
    }

    // Setup event handlers for this socket
    this.setupSocketEvents(socket);
  }

  /**
   * Setup individual socket event handlers
   */
  setupSocketEvents(socket) {
    const user = socket.user;

    // =================
    // AUCTION ROOM EVENTS
    // =================
    
    // Join auction room for general updates
    socket.on('join-auction', (auctionId) => {
      this.handleJoinAuction(socket, auctionId);
    });

    // Leave auction room
    socket.on('leave-auction', (auctionId) => {
      this.handleLeaveAuction(socket, auctionId);
    });

    // Join live auction room for real-time bidding
    socket.on('join-live-auction', (auctionId) => {
      this.handleJoinLiveAuction(socket, auctionId);
    });

    // Leave live auction room
    socket.on('leave-live-auction', (auctionId) => {
      this.handleLeaveLiveAuction(socket, auctionId);
    });

    // =================
    // BIDDING EVENTS
    // =================
    
    // Handle bid placement
    socket.on('place-bid', (bidData) => {
      this.handleBidPlacement(socket, bidData);
    });

    // Handle auto-bidding setup
    socket.on('setup-auto-bid', (autoBidData) => {
      this.handleAutoBidSetup(socket, autoBidData);
    });

    // Cancel auto-bidding
    socket.on('cancel-auto-bid', (auctionId) => {
      this.handleCancelAutoBid(socket, auctionId);
    });

    // =================
    // AUCTION MANAGEMENT EVENTS
    // =================
    
    // Start auction (sellers/admins only)
    socket.on('start-auction', (auctionId) => {
      this.handleStartAuction(socket, auctionId);
    });

    // End auction (sellers/admins only)
    socket.on('end-auction', (auctionId) => {
      this.handleEndAuction(socket, auctionId);
    });

    // =================
    // COMMUNICATION EVENTS
    // =================
    
    // Join order chat room
    socket.on('join-order-chat', (orderId) => {
      socket.join(`order-chat-${orderId}`);
      console.log(`💬 ${user.name} joined order chat: ${orderId}`);
    });

    // Send message in order chat
    socket.on('send-order-message', (messageData) => {
      this.handleOrderMessage(socket, messageData);
    });

    // Ask question about auction
    socket.on('ask-question', (questionData) => {
      this.handleAuctionQuestion(socket, questionData);
    });

    // =================
    // NOTIFICATION EVENTS
    // =================
    
    // Mark notification as read
    socket.on('mark-notification-read', (notificationId) => {
      console.log(`📖 Notification ${notificationId} marked as read by ${user.name}`);
    });

    // =================
    // ADMIN EVENTS
    // =================
    
    if (user.role === 'admin') {
      // Moderate content
      socket.on('moderate-content', (moderationData) => {
        this.handleContentModeration(socket, moderationData);
      });

      // Feature/unfeature auction
      socket.on('feature-auction', (auctionId) => {
        this.handleFeatureAuction(socket, auctionId);
      });

      // Handle disputes
      socket.on('resolve-dispute', (disputeData) => {
        this.handleDisputeResolution(socket, disputeData);
      });
    }

    // =================
    // CONNECTION EVENTS
    // =================
    
    // Handle heartbeat for connection monitoring
    socket.on('heartbeat', () => {
      socket.emit('heartbeat-ack', { timestamp: new Date() });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error(`🚨 Socket error for ${user.name}:`, error);
    });
  }

  // =================
  // EVENT HANDLER METHODS
  // =================

  /**
   * Handle joining an auction room
   */
  async handleJoinAuction(socket, auctionId) {
    try {
      const auction = await Auction.findById(auctionId);
      if (!auction) {
        socket.emit('error', { message: 'Auction not found' });
        return;
      }

      const roomName = `auction-${auctionId}`;
      socket.join(roomName);
      
      // Track room membership
      if (!this.auctionRooms.has(auctionId)) {
        this.auctionRooms.set(auctionId, new Set());
      }
      this.auctionRooms.get(auctionId).add(socket.id);

      const roomSize = this.io.sockets.adapter.rooms.get(roomName)?.size || 0;
      
      console.log(`🏺 ${socket.user.name} joined auction ${auction.title} (${roomSize} viewers)`);
      
      // Notify user of successful join
      socket.emit('auction-joined', {
        auctionId,
        auctionTitle: auction.title,
        viewerCount: roomSize,
        currentPrice: auction.currentPrice,
        status: auction.status
      });

      // Notify others in room
      socket.to(roomName).emit('viewer-joined', {
        viewerCount: roomSize,
        userName: socket.user.name
      });

    } catch (error) {
      console.error('Error joining auction:', error);
      socket.emit('error', { message: 'Failed to join auction' });
    }
  }

  /**
   * Handle leaving an auction room
   */
  handleLeaveAuction(socket, auctionId) {
    const roomName = `auction-${auctionId}`;
    socket.leave(roomName);
    
    // Update room tracking
    if (this.auctionRooms.has(auctionId)) {
      this.auctionRooms.get(auctionId).delete(socket.id);
      if (this.auctionRooms.get(auctionId).size === 0) {
        this.auctionRooms.delete(auctionId);
      }
    }

    const roomSize = this.io.sockets.adapter.rooms.get(roomName)?.size || 0;
    
    console.log(`🚪 ${socket.user.name} left auction ${auctionId} (${roomSize} viewers remaining)`);
    
    // Notify others in room
    socket.to(roomName).emit('viewer-left', {
      viewerCount: roomSize,
      userName: socket.user.name
    });
  }

  /**
   * Handle joining live auction room for real-time bidding
   */
  async handleJoinLiveAuction(socket, auctionId) {
    try {
      const auction = await Auction.findById(auctionId);
      if (!auction || auction.status !== 'active') {
        socket.emit('error', { message: 'Live auction not available' });
        return;
      }

      const roomName = `live-auction-${auctionId}`;
      socket.join(roomName);
      
      const roomSize = this.io.sockets.adapter.rooms.get(roomName)?.size || 0;
      
      console.log(`🔴 ${socket.user.name} joined LIVE auction ${auction.title} (${roomSize} bidders)`);
      
      // Send current auction state
      const recentBids = await Bid.find({ auction: auctionId })
        .populate('bidder', 'name')
        .sort({ bidTime: -1 })
        .limit(10);

      socket.emit('live-auction-joined', {
        auctionId,
        auctionTitle: auction.title,
        currentPrice: auction.currentPrice,
        totalBids: auction.totalBids,
        endTime: auction.endTime,
        timeRemaining: Math.max(0, auction.endTime - new Date()),
        recentBids: recentBids.map(bid => ({
          amount: bid.amount,
          bidder: bid.bidder.name,
          bidTime: bid.bidTime
        })),
        activeBidders: roomSize
      });

      // Notify others
      socket.to(roomName).emit('bidder-joined', {
        activeBidders: roomSize,
        bidderName: socket.user.name
      });

    } catch (error) {
      console.error('Error joining live auction:', error);
      socket.emit('error', { message: 'Failed to join live auction' });
    }
  }

  /**
   * Handle leaving live auction room
   */
  handleLeaveLiveAuction(socket, auctionId) {
    const roomName = `live-auction-${auctionId}`;
    socket.leave(roomName);
    
    const roomSize = this.io.sockets.adapter.rooms.get(roomName)?.size || 0;
    
    console.log(`🔴 ${socket.user.name} left LIVE auction ${auctionId} (${roomSize} bidders remaining)`);
    
    // Notify others
    socket.to(roomName).emit('bidder-left', {
      activeBidders: roomSize,
      bidderName: socket.user.name
    });
  }

  /**
   * Handle bid placement
   */
  async handleBidPlacement(socket, bidData) {
    try {
      const { auctionId, amount, bidType = 'manual' } = bidData;
      
      // Validate auction and bid (this would typically be done in the controller)
      const auction = await Auction.findById(auctionId);
      if (!auction || auction.status !== 'active') {
        socket.emit('bid-rejected', { message: 'Auction is not active' });
        return;
      }

      if (auction.seller.toString() === socket.user._id.toString()) {
        socket.emit('bid-rejected', { message: 'Cannot bid on your own auction' });
        return;
      }

      if (amount <= auction.currentPrice) {
        socket.emit('bid-rejected', { message: 'Bid must be higher than current price' });
        return;
      }

      // Create bid object (this would typically be saved to DB in the controller)
      const bidInfo = {
        auctionId,
        amount,
        bidder: {
          id: socket.user._id,
          name: socket.user.name
        },
        bidTime: new Date(),
        bidType
      };

      console.log(`💰 New bid: ${socket.user.name} bid $${amount} on auction ${auctionId}`);

      // Emit to all users in auction rooms
      this.io.to(`auction-${auctionId}`).emit('new-bid', bidInfo);
      this.io.to(`live-auction-${auctionId}`).emit('live-bid-update', {
        ...bidInfo,
        newCurrentPrice: amount,
        totalBids: auction.totalBids + 1
      });

      // Notify the seller
      this.emitToUser(auction.seller.toString(), 'new-bid-on-your-auction', {
        auctionId,
        auctionTitle: auction.title,
        bidAmount: amount,
        bidderName: socket.user.name
      });

      // Confirm to bidder
      socket.emit('bid-confirmed', {
        auctionId,
        amount,
        currentLeader: true
      });

    } catch (error) {
      console.error('Error handling bid placement:', error);
      socket.emit('bid-rejected', { message: 'Failed to place bid' });
    }
  }

  /**
   * Handle auto-bid setup
   */
  handleAutoBidSetup(socket, autoBidData) {
    const { auctionId, maxAmount } = autoBidData;
    
    socket.join(`auto-bid-${auctionId}`);
    
    console.log(`🤖 Auto-bid setup: ${socket.user.name} on auction ${auctionId} up to $${maxAmount}`);
    
    // Store auto-bid info (in production, this would be saved to database)
    socket.autoBids = socket.autoBids || {};
    socket.autoBids[auctionId] = { maxAmount, active: true };
    
    socket.emit('auto-bid-confirmed', { auctionId, maxAmount });
  }

  /**
   * Handle auto-bid cancellation
   */
  handleCancelAutoBid(socket, auctionId) {
    socket.leave(`auto-bid-${auctionId}`);
    
    if (socket.autoBids && socket.autoBids[auctionId]) {
      socket.autoBids[auctionId].active = false;
    }
    
    console.log(`🚫 Auto-bid cancelled: ${socket.user.name} on auction ${auctionId}`);
    socket.emit('auto-bid-cancelled', { auctionId });
  }

  /**
   * Handle order message
   */
  handleOrderMessage(socket, messageData) {
    const { orderId, message } = messageData;
    
    const messageInfo = {
      orderId,
      message,
      sender: {
        id: socket.user._id,
        name: socket.user.name
      },
      timestamp: new Date()
    };

    // Emit to all users in the order chat room
    this.io.to(`order-chat-${orderId}`).emit('new-order-message', messageInfo);
    
    console.log(`💬 Order message: ${socket.user.name} in order ${orderId}`);
  }

  /**
   * Handle auction question
   */
  handleAuctionQuestion(socket, questionData) {
    const { auctionId, question } = questionData;
    
    // This would typically save to database and notify seller
    console.log(`❓ New question on auction ${auctionId} from ${socket.user.name}: ${question}`);
    
    // Emit confirmation to questioner
    socket.emit('question-submitted', { auctionId, question });
  }

  /**
   * Handle content moderation (admin only)
   */
  handleContentModeration(socket, moderationData) {
    if (socket.user.role !== 'admin') return;
    
    const { contentType, contentId, action, reason } = moderationData;
    
    console.log(`🛡️ Content moderated by ${socket.user.name}: ${action} on ${contentType} ${contentId}`);
    
    // Notify other admins
    socket.to('admin-room').emit('content-moderated', {
      contentType,
      contentId,
      action,
      reason,
      moderator: socket.user.name,
      timestamp: new Date()
    });
  }

  /**
   * Handle disconnection
   */
  handleDisconnection(socket, reason) {
    const user = socket.user;
    
    // Clean up tracking
    this.connectedUsers.delete(socket.id);
    
    // Clean up auction room tracking
    for (const [auctionId, socketSet] of this.auctionRooms.entries()) {
      socketSet.delete(socket.id);
      if (socketSet.size === 0) {
        this.auctionRooms.delete(auctionId);
      }
    }
    
    console.log(`🔌 User disconnected: ${user?.name || 'Unknown'} (${socket.id}) - Reason: ${reason}`);
    
    // Notify admin room if admin disconnected
    if (user?.role === 'admin') {
      this.emitToAdmins('admin-user-disconnected', { userName: user.name });
    }
  }

  // =================
  // UTILITY METHODS FOR CONTROLLERS
  // =================

  /**
   * Emit auction update to all users in auction room
   */
  emitAuctionUpdate(auctionId, eventType, data) {
    this.io.to(`auction-${auctionId}`).emit(eventType, {
      auctionId,
      ...data,
      timestamp: new Date()
    });
    
    console.log(`📡 Auction update emitted: ${eventType} for auction ${auctionId}`);
  }

  /**
   * Emit live auction update to active bidders
   */
  emitLiveAuctionUpdate(auctionId, data) {
    this.io.to(`live-auction-${auctionId}`).emit('live-auction-update', {
      auctionId,
      ...data,
      timestamp: new Date()
    });
    
    console.log(`🔴 Live auction update emitted for auction ${auctionId}`);
  }

  /**
   * Send notification to specific user
   */
  emitToUser(userId, eventType, data) {
    this.io.to(`user-${userId}`).emit(eventType, {
      ...data,
      timestamp: new Date()
    });
  }

  /**
   * Send notification to all users with specific role
   */
  emitToRole(role, eventType, data) {
    this.io.to(`role-${role}`).emit(eventType, {
      ...data,
      timestamp: new Date()
    });
  }

  /**
   * Send notification to all admins
   */
  emitToAdmins(eventType, data) {
    this.io.to('admin-room').emit(eventType, {
      ...data,
      timestamp: new Date()
    });
  }

  /**
   * Broadcast system-wide announcement
   */
  broadcastAnnouncement(announcement) {
    this.io.emit('system-announcement', {
      ...announcement,
      timestamp: new Date()
    });
    
    console.log(`📢 System announcement broadcasted: ${announcement.message}`);
  }

  /**
   * Get statistics about connected users and rooms
   */
  getStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      activeAuctionRooms: this.auctionRooms.size,
      totalRooms: this.io.sockets.adapter.rooms.size,
      usersByRole: {
        buyers: Array.from(this.connectedUsers.values()).filter(u => u.userRole === 'buyer').length,
        sellers: Array.from(this.connectedUsers.values()).filter(u => u.userRole === 'seller').length,
        admins: Array.from(this.connectedUsers.values()).filter(u => u.userRole === 'admin').length
      }
    };
  }
}

module.exports = SocketService;
