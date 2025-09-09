# BidCraft Backend API Testing Suite

Comprehensive testing suite for the BidCraft auction platform backend, including REST API endpoints and Socket.io real-time functionality.

## 🚀 Features

### API Testing
- **Authentication**: User registration, login, role-based access
- **Auctions**: CRUD operations, search, filtering, pagination
- **Bidding**: Place bids, bid validation, auto-bidding, buy now
- **User Management**: Profiles, watchlists, purchase history
- **Admin Functions**: Dashboard, user management, content moderation
- **Error Handling**: Invalid requests, unauthorized access, malformed data
- **Performance**: Response times, concurrent requests, pagination

### Socket.io Real-time Testing
- **Connection Management**: Authentication, role-based rooms
- **Auction Rooms**: Join/leave, viewer counts, notifications
- **Live Bidding**: Real-time bid updates, bid confirmations
- **Auto-bidding**: Setup, cancellation, proxy bidding
- **Admin Features**: Content moderation, system announcements
- **Error Handling**: Invalid tokens, connection failures

## 📋 Prerequisites

1. **Backend Server Running**
   ```bash
   cd backend
   npm install
   npm start
   ```
   Server should be accessible at `http://localhost:5000`

2. **MongoDB Connection**
   - Local MongoDB instance running
   - Database accessible and configured

3. **Environment Variables**
   - JWT_SECRET configured
   - MongoDB connection string set
   - All required environment variables

## 🛠️ Installation

1. **Navigate to tests directory**
   ```bash
   cd backend/tests
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

## 🧪 Running Tests

### All Tests (Recommended)
```bash
npm run test:all
```

### API Tests Only
```bash
npm test
# or
node run-tests.js --api-only
```

### Socket.io Tests Only
```bash
npm run test:socket
# or
node run-tests.js --socket-only
```

### Watch Mode (Development)
```bash
npm run test:watch
```

### Individual Test Files
```bash
# API tests
node api-test-suite.js

# Socket.io tests
node socket-test.js

# Complete test runner
node run-tests.js
```

## 📊 Test Categories

### 1. Server Health
- Health endpoint availability
- Response format validation
- Server status verification

### 2. Authentication & Authorization
- User registration (buyer, seller, admin)
- Login functionality
- JWT token validation
- Protected route access
- Role-based permissions

### 3. Category Management
- Category listing
- Category tree structure
- Category-based filtering

### 4. Auction Management
- Create auctions (seller only)
- List all auctions
- Search and filtering
- Auction details retrieval
- Pagination support

### 5. Bidding System
- Place manual bids
- Bid amount validation
- Seller bidding restrictions
- Buy now functionality
- Bid history retrieval
- Bid retraction (time limits)

### 6. User Management
- User dashboard access
- Watchlist management
- Purchase/selling history
- Profile information

### 7. Admin Functionality
- Admin dashboard
- User management
- Content moderation
- System analytics
- Bulk operations

### 8. Socket.io Real-time
- Connection authentication
- Auction room management
- Live bidding updates
- Real-time notifications
- Auto-bidding system
- Admin real-time features

### 9. Error Handling
- Invalid requests
- Unauthorized access
- Malformed data
- Network errors
- Timeout handling

### 10. Performance
- Response time testing
- Concurrent request handling
- Load testing basics
- Memory usage monitoring

## 📈 Test Results

### Output Format
Tests generate colored console output with:
- ✅ Passed tests in green
- ❌ Failed tests in red
- ⚠️ Warnings in yellow
- 📊 Statistics and summaries

### Report Generation
- JSON reports saved with timestamps
- Detailed test breakdown
- Performance metrics
- Failed test details

### Example Output
```
🚀 STARTING COMPREHENSIVE API TEST SUITE
============================================================

🏥 TESTING SERVER HEALTH
✅ Health endpoint responds
✅ Health response contains status
✅ Health response contains timestamp

🔐 TESTING AUTHENTICATION
✅ buyer registration successful
✅ seller registration successful
✅ admin registration successful
✅ Protected route accessible with token
✅ Protected route blocks invalid token

... (continued)

📊 TEST RESULTS SUMMARY
============================================================
📈 Total Tests: 45
✅ Passed: 43
❌ Failed: 2
⏱️  Total Time: 12.5s
📊 Success Rate: 95.6%
```

## 🔧 Configuration

### Test Users
The test suite creates these test users:
- **Buyer**: `testbuyer@example.com`
- **Seller**: `testseller@example.com` 
- **Admin**: `testadmin@example.com`

Password for all: `testpass123`

### Server Configuration
- Base URL: `http://localhost:5000`
- API Base: `http://localhost:5000/api`
- Socket.io: `http://localhost:5000` (same server)

### Timeouts
- API requests: 30 seconds
- Socket.io connections: 10 seconds
- Real-time events: 15 seconds

## 🐛 Troubleshooting

### Common Issues

1. **Connection Refused**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:5000
   ```
   Solution: Start the backend server

2. **Authentication Failures**
   ```
   ❌ buyer authentication failed
   ```
   Solution: Check JWT_SECRET configuration

3. **Socket.io Connection Issues**
   ```
   ❌ Socket connection timeout
   ```
   Solution: Verify Socket.io server initialization

4. **Database Errors**
   ```
   ❌ Auction creation failed
   ```
   Solution: Check MongoDB connection

### Debug Mode
Add environment variable for verbose logging:
```bash
DEBUG=bidcraft:* node run-tests.js
```

### Manual Testing
Use individual test functions for debugging:
```javascript
const { makeRequest } = require('./api-test-suite');

// Test specific endpoint
makeRequest('/health').then(console.log);
```

## 📝 Adding New Tests

### API Test Structure
```javascript
async function testNewFeature() {
  log('\n🆕 TESTING NEW FEATURE', 'cyan');
  
  const response = await makeRequest('/new-endpoint', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authTokens.user}`
    },
    body: JSON.stringify(testData)
  });
  
  logTest('New feature works', response.ok);
}
```

### Socket.io Test Structure
```javascript
function testNewSocketFeature() {
  return new Promise((resolve) => {
    const socket = io(BASE_URL, {
      auth: { token: authTokens.user }
    });
    
    socket.on('connect', () => {
      socket.emit('new-event', testData);
    });
    
    socket.on('new-response', (data) => {
      // Validate response
      resolve({ success: true });
    });
  });
}
```

## 🤝 Contributing

1. Add tests for new features
2. Maintain test coverage above 80%
3. Update documentation
4. Test error scenarios
5. Include performance considerations

## 📄 License

This testing suite is part of the BidCraft project and follows the same license terms.
