# BidCraft Socket.io Implementation Guide

## Overview
This document provides a comprehensive guide to the enhanced Socket.io implementation for the BidCraft auction platform. The implementation provides real-time communication for auctions, bidding, notifications, and administrative functions.

## Features

### 🔐 **Authentication & Security**
- JWT-based authentication for all socket connections
- Role-based room access (buyer, seller, admin)
- User session tracking and management
- Secure token validation and user verification

### 🏺 **Auction Room Management**
- **Standard Auction Rooms**: General auction updates and viewer tracking
- **Live Auction Rooms**: Real-time bidding with immediate updates
- **Room Statistics**: Active participant counting and monitoring
- **Automatic Cleanup**: Efficient room management and memory usage

### 💰 **Real-time Bidding System**
- **Immediate Bid Updates**: All participants receive instant bid notifications
- **Bid Validation**: Server-side validation with immediate feedback
- **Auto-bidding Support**: Automated bidding up to user-defined limits
- **Bid Rejection Handling**: Clear error messages for invalid bids

### 🔔 **Notification System**
- **User-specific Notifications**: Targeted messages to individual users
- **Role-based Broadcasting**: Messages to all users of a specific role
- **System Announcements**: Platform-wide notifications
- **Real-time Alerts**: Auction wins, sales, and important updates

### 👑 **Administrative Features**
- **Content Moderation**: Real-time moderation tools and notifications
- **Platform Statistics**: Live user and auction metrics
- **System Monitoring**: Connection tracking and performance metrics
- **Admin Communication**: Dedicated admin-only channels

## Socket Events Reference

### Connection Events

#### Client → Server
```javascript
// Authentication is handled automatically via JWT token in connection
```

#### Server → Client
```javascript
// Connection established
socket.on('connected', () => {
  console.log('Connected to BidCraft');
});

// Connection lost
socket.on('disconnected', (reason) => {
  console.log('Disconnected:', reason);
});

// Heartbeat acknowledgment
socket.on('heartbeat-ack', (data) => {
  console.log('Heartbeat at:', data.timestamp);
});
```

### Auction Room Events

#### Client → Server
```javascript
// Join auction room for general updates
socket.emit('join-auction', auctionId);

// Leave auction room
socket.emit('leave-auction', auctionId);

// Join live auction room for real-time bidding
socket.emit('join-live-auction', auctionId);

// Leave live auction room
socket.emit('leave-live-auction', auctionId);
```

#### Server → Client
```javascript
// Successfully joined auction
socket.on('auction-joined', (data) => {
  /*
  data = {
    auctionId: "...",
    auctionTitle: "...",
    viewerCount: 15,
    currentPrice: 250.00,
    status: "active"
  }
  */
});

// New viewer joined
socket.on('viewer-joined', (data) => {
  /*
  data = {
    viewerCount: 16,
    userName: "John Doe"
  }
  */
});

// Successfully joined live auction
socket.on('live-auction-joined', (data) => {
  /*
  data = {
    auctionId: "...",
    auctionTitle: "...",
    currentPrice: 250.00,
    totalBids: 12,
    endTime: "2024-01-15T18:00:00Z",
    timeRemaining: 3600000,
    recentBids: [...],
    activeBidders: 8
  }
  */
});
```

### Bidding Events

#### Client → Server
```javascript
// Place a bid
socket.emit('place-bid', {
  auctionId: "auction-id",
  amount: 275.00,
  bidType: 'manual' // 'manual', 'automatic', 'buy_now'
});

// Setup auto-bidding
socket.emit('setup-auto-bid', {
  auctionId: "auction-id",
  maxAmount: 500.00
});

// Cancel auto-bidding
socket.emit('cancel-auto-bid', auctionId);
```

#### Server → Client
```javascript
// New bid placed (all auction participants)
socket.on('new-bid', (data) => {
  /*
  data = {
    auctionId: "...",
    amount: 275.00,
    bidder: {
      id: "...",
      name: "Jane Smith"
    },
    bidTime: "2024-01-15T15:30:00Z",
    bidType: "manual"
  }
  */
});

// Live auction bid update
socket.on('live-bid-update', (data) => {
  /*
  data = {
    auctionId: "...",
    eventType: "new-bid",
    newCurrentPrice: 275.00,
    totalBids: 13,
    leadingBidder: {
      id: "...",
      name: "Jane Smith"
    },
    bidTime: "2024-01-15T15:30:00Z"
  }
  */
});

// Bid confirmation (to bidder)
socket.on('bid-confirmed', (data) => {
  /*
  data = {
    auctionId: "...",
    amount: 275.00,
    currentLeader: true
  }
  */
});

// Bid rejection (to bidder)
socket.on('bid-rejected', (data) => {
  /*
  data = {
    message: "Bid must be higher than current price"
  }
  */
});
```

### Auction Lifecycle Events

#### Server → Client
```javascript
// Auction ended
socket.on('auction-ended', (data) => {
  /*
  data = {
    auctionId: "...",
    winner: {
      id: "...",
      name: "Winner Name"
    },
    finalPrice: 450.00,
    endType: "time_expired", // "time_expired", "buy_now", "no_reserve_met"
    auctionTitle: "..."
  }
  */
});

// Auction cancelled
socket.on('auction-cancelled', (data) => {
  /*
  data = {
    auctionId: "...",
    auctionTitle: "...",
    reason: "Cancelled by seller"
  }
  */
});

// New auction available (to buyers)
socket.on('new-auction-available', (data) => {
  /*
  data = {
    auctionId: "...",
    title: "...",
    category: "...",
    startingPrice: 50.00,
    endTime: "...",
    sellerName: "..."
  }
  */
});
```

### Notification Events

#### Server → Client
```javascript
// Personal notification
socket.on('notification', (data) => {
  /*
  data = {
    type: "info", // "info", "warning", "success", "error"
    title: "New Message",
    message: "You have a new message from seller",
    timestamp: "2024-01-15T15:30:00Z"
  }
  */
});

// Auction won notification
socket.on('auction-won', (data) => {
  /*
  data = {
    auctionId: "...",
    auctionTitle: "...",
    winningAmount: 450.00,
    sellerName: "..."
  }
  */
});

// Auction sold notification (to seller)
socket.on('auction-sold', (data) => {
  /*
  data = {
    auctionId: "...",
    auctionTitle: "...",
    finalPrice: 450.00,
    buyerName: "...",
    saleType: "auction_end" // "auction_end", "buy_now"
  }
  */
});

// System announcement
socket.on('system-announcement', (data) => {
  /*
  data = {
    type: "maintenance", // "maintenance", "feature", "warning"
    title: "System Maintenance",
    message: "Scheduled maintenance at 2 AM UTC",
    timestamp: "..."
  }
  */
});
```

### Administrative Events

#### Client → Server (Admin only)
```javascript
// Moderate content
socket.emit('moderate-content', {
  contentType: 'auction', // 'auction', 'user', 'bid'
  contentId: 'content-id',
  action: 'approve', // 'approve', 'reject', 'flag'
  reason: 'Content meets guidelines'
});

// Feature auction
socket.emit('feature-auction', auctionId);

// Resolve dispute
socket.emit('resolve-dispute', {
  disputeId: 'dispute-id',
  resolution: 'buyer_favor', // 'buyer_favor', 'seller_favor', 'mediation'
  reason: 'Item not as described'
});
```

#### Server → Client (Admin only)
```javascript
// Content moderated by another admin
socket.on('content-moderated', (data) => {
  /*
  data = {
    contentType: 'auction',
    contentId: '...',
    action: 'approve',
    reason: '...',
    moderator: 'Admin Name',
    timestamp: '...'
  }
  */
});

// Admin user connected/disconnected
socket.on('admin-user-connected', (data) => {
  // { userName: 'Admin Name' }
});
```

## Room Structure

### Room Naming Convention
- **User Rooms**: `user-{userId}` - Personal notifications
- **Role Rooms**: `role-{role}` - Role-based broadcasts
- **Auction Rooms**: `auction-{auctionId}` - General auction updates
- **Live Auction Rooms**: `live-auction-{auctionId}` - Real-time bidding
- **Auto-bid Rooms**: `auto-bid-{auctionId}` - Auto-bidding participants
- **Order Chat Rooms**: `order-chat-{orderId}` - Post-auction communication
- **Admin Room**: `admin-room` - Administrative communications

### Room Management
- Users automatically join personal and role rooms on connection
- Auction rooms are joined/left explicitly by user actions
- Automatic cleanup when rooms become empty
- Memory-efficient tracking of room memberships

## Error Handling

### Connection Errors
```javascript
socket.on('connect_error', (error) => {
  // Handle authentication failures, network issues
  console.error('Connection failed:', error.message);
});

socket.on('error', (error) => {
  // Handle runtime errors
  console.error('Socket error:', error);
});
```

### Bid Errors
```javascript
socket.on('bid-rejected', (data) => {
  // Handle bid validation failures
  // Common reasons: insufficient amount, auction ended, seller bidding on own item
  console.error('Bid rejected:', data.message);
});
```

### Reconnection Logic
The client should implement exponential backoff for reconnection:
```javascript
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

socket.on('disconnect', () => {
  if (reconnectAttempts < maxReconnectAttempts) {
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
    setTimeout(() => {
      socket.connect();
      reconnectAttempts++;
    }, delay);
  }
});

socket.on('connect', () => {
  reconnectAttempts = 0; // Reset on successful connection
});
```

## Performance Considerations

### Scalability
- **Room-based Architecture**: Efficient message targeting
- **Connection Pooling**: Optimal resource usage
- **Memory Management**: Automatic cleanup of inactive rooms
- **Load Distribution**: Ready for horizontal scaling

### Optimization Tips
1. **Selective Event Listening**: Only listen to needed events
2. **Efficient Room Management**: Leave rooms when not needed
3. **Heartbeat Monitoring**: Detect and handle dead connections
4. **Batch Updates**: Group related notifications when possible

## Security Measures

### Authentication
- JWT token validation on connection
- Role-based access control
- User session tracking
- Automatic disconnection of invalid sessions

### Data Validation
- Server-side validation of all incoming data
- Sanitization of user inputs
- Rate limiting for sensitive operations
- Protection against injection attacks

### Privacy
- User information is limited to necessary fields
- Sensitive data is never transmitted via sockets
- Auction details respect privacy settings
- Admin functions are strictly access-controlled

## Integration Examples

### React Hook
```javascript
import { useEffect, useState } from 'react';
import BidCraftSocketClient from './socketClient';

export const useSocket = (authToken) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (authToken) {
      const client = new BidCraftSocketClient(authToken);
      
      client.on('connected', () => setConnected(true));
      client.on('disconnected', () => setConnected(false));
      
      client.connect();
      setSocket(client);
      
      return () => client.disconnect();
    }
  }, [authToken]);

  return { socket, connected };
};
```

### Vue.js Plugin
```javascript
// socketPlugin.js
export default {
  install(app, options) {
    const socket = new BidCraftSocketClient(options.token);
    socket.connect();
    
    app.config.globalProperties.$socket = socket;
    app.provide('socket', socket);
  }
};
```

## Testing

### Unit Tests
Run the comprehensive test suite:
```bash
node test-socket.js
```

### Load Testing
Test with multiple concurrent users:
```bash
node test-socket.js --load 100
```

### Integration Testing
Test with actual backend:
1. Start the BidCraft backend server
2. Run the test suite
3. Monitor logs for successful event handling

## Monitoring & Debugging

### Server-side Logging
- Connection events with user details
- Room join/leave events
- Bid placement and validation
- Error occurrences with context
- Performance metrics

### Client-side Debugging
- Enable Socket.io debug mode: `localStorage.debug = 'socket.io-client:socket'`
- Monitor network tab for WebSocket connections
- Log all received events for debugging
- Track connection state changes

## Deployment Considerations

### Production Setup
- Use Redis adapter for multi-server deployments
- Configure CORS properly for your domain
- Set up SSL/TLS for secure connections
- Implement proper logging and monitoring

### Environment Variables
```bash
# Socket.io Configuration
SOCKETIO_CORS_ORIGIN=https://yourdomain.com
SOCKETIO_PING_TIMEOUT=20000
SOCKETIO_PING_INTERVAL=25000

# Redis (for scaling)
REDIS_URL=redis://localhost:6379
```

### Scaling
For horizontal scaling, use Redis adapter:
```javascript
const redis = require('socket.io-redis');
io.adapter(redis({ host: 'localhost', port: 6379 }));
```

## Troubleshooting

### Common Issues

1. **Connection Failures**
   - Check JWT token validity
   - Verify server is running
   - Check CORS configuration

2. **Room Events Not Received**
   - Ensure proper room joining
   - Check user permissions
   - Verify event names match

3. **Performance Issues**
   - Monitor room sizes
   - Check for memory leaks
   - Optimize event listeners

4. **Authentication Errors**
   - Verify JWT secret consistency
   - Check token expiration
   - Ensure user exists and is active

## Support

For additional support or feature requests, please refer to the BidCraft development team or create an issue in the project repository.

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Author**: BidCraft Development Team
