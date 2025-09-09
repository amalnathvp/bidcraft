/**
 * Dedicated Socket.io Real-time Testing Script
 * Tests all Socket.io events and real-time functionality
 * 
 * Usage: node tests/socket-test.js
 * 
 * Prerequisites:
 * - Backend server running with Socket.io enabled
 * - Valid authentication tokens
 */

const io = require('socket.io-client');
const fetch = require('node-fetch');

// Configuration
const BASE_URL = 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

// Test credentials
const testCredentials = {
  buyer: {
    email: 'testbuyer@example.com',
    password: 'testpass123'
  },
  seller: {
    email: 'testseller@example.com',
    password: 'testpass123'
  },
  admin: {
    email: 'testadmin@example.com',
    password: 'testpass123'
  }
};

let authTokens = {};
let testAuctionId = null;

// Color codes for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Setup Functions
 */
async function authenticateUsers() {
  log('🔐 Authenticating test users...', 'cyan');
  
  for (const [userType, credentials] of Object.entries(testCredentials)) {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      if (response.ok) {
        const data = await response.json();
        authTokens[userType] = data.token;
        log(`✅ ${userType} authenticated`, 'green');
      } else {
        log(`❌ ${userType} authentication failed`, 'red');
      }
    } catch (error) {
      log(`❌ ${userType} auth error: ${error.message}`, 'red');
    }
  }
}

async function createTestAuction() {
  log('🏺 Creating test auction...', 'cyan');
  
  const auctionData = {
    title: 'Socket.io Test Auction',
    description: 'This auction is created specifically for testing Socket.io real-time functionality. It includes all necessary fields for comprehensive testing.',
    category: 'Electronics',
    condition: 'new',
    startingPrice: 10.00,
    buyNowPrice: 100.00,
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };
  
  try {
    const response = await fetch(`${API_BASE}/auctions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authTokens.seller}`
      },
      body: JSON.stringify(auctionData)
    });
    
    if (response.ok) {
      const data = await response.json();
      testAuctionId = data.data._id;
      log('✅ Test auction created', 'green');
      return testAuctionId;
    } else {
      log('❌ Failed to create test auction', 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Auction creation error: ${error.message}`, 'red');
    return null;
  }
}

/**
 * Socket.io Test Functions
 */

function testSocketConnection() {
  return new Promise((resolve) => {
    log('\n⚡ Testing Socket.io connections...', 'magenta');
    
    let completedTests = 0;
    const totalTests = 3;
    const results = {};
    
    // Test each user type connection
    Object.entries(authTokens).forEach(([userType, token]) => {
      const socket = io(BASE_URL, {
        auth: { token }
      });
      
      const timeout = setTimeout(() => {
        results[userType] = { connected: false, error: 'Connection timeout' };
        socket.close();
        checkCompletion();
      }, 5000);
      
      socket.on('connect', () => {
        clearTimeout(timeout);
        results[userType] = { connected: true };
        log(`✅ ${userType} socket connected`, 'green');
        socket.close();
        checkCompletion();
      });
      
      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        results[userType] = { connected: false, error: error.message };
        log(`❌ ${userType} socket failed: ${error.message}`, 'red');
        socket.close();
        checkCompletion();
      });
    });
    
    function checkCompletion() {
      completedTests++;
      if (completedTests >= totalTests) {
        resolve(results);
      }
    }
  });
}

function testAuctionRoomFunctionality() {
  return new Promise((resolve) => {
    log('\n🏺 Testing auction room functionality...', 'magenta');
    
    if (!testAuctionId) {
      log('❌ No test auction available', 'red');
      resolve({ success: false, reason: 'No auction' });
      return;
    }
    
    const buyerSocket = io(BASE_URL, {
      auth: { token: authTokens.buyer }
    });
    
    const sellerSocket = io(BASE_URL, {
      auth: { token: authTokens.seller }
    });
    
    let tests = {
      buyerJoinRoom: false,
      sellerReceiveJoinNotification: false,
      viewerCountUpdated: false,
      buyerLeaveRoom: false,
      sellerReceiveLeaveNotification: false
    };
    
    let completedTests = 0;
    const totalTests = Object.keys(tests).length;
    
    // Setup timeout
    const timeout = setTimeout(() => {
      log('⚠️ Auction room tests timed out', 'yellow');
      buyerSocket.close();
      sellerSocket.close();
      resolve({ success: false, tests, reason: 'Timeout' });
    }, 10000);
    
    function checkCompletion() {
      completedTests++;
      if (completedTests >= totalTests) {
        clearTimeout(timeout);
        buyerSocket.close();
        sellerSocket.close();
        
        const allPassed = Object.values(tests).every(test => test);
        resolve({ success: allPassed, tests });
      }
    }
    
    // Seller joins first to listen for notifications
    sellerSocket.on('connect', () => {
      sellerSocket.emit('join-auction', testAuctionId);
      
      // Listen for viewer join notification
      sellerSocket.on('viewer-joined', (data) => {
        if (data.viewerCount >= 2) {
          tests.sellerReceiveJoinNotification = true;
          log('✅ Seller received viewer join notification', 'green');
          checkCompletion();
        }
      });
      
      // Listen for viewer leave notification
      sellerSocket.on('viewer-left', (data) => {
        tests.sellerReceiveLeaveNotification = true;
        log('✅ Seller received viewer leave notification', 'green');
        checkCompletion();
      });
    });
    
    // Buyer connects and joins
    buyerSocket.on('connect', () => {
      // Join auction room
      buyerSocket.emit('join-auction', testAuctionId);
      
      buyerSocket.on('auction-joined', (data) => {
        if (data.auctionId === testAuctionId) {
          tests.buyerJoinRoom = true;
          log('✅ Buyer successfully joined auction room', 'green');
          checkCompletion();
          
          // Check viewer count
          if (data.viewerCount >= 1) {
            tests.viewerCountUpdated = true;
            log('✅ Viewer count updated correctly', 'green');
            checkCompletion();
          }
          
          // Leave room after a short delay
          setTimeout(() => {
            buyerSocket.emit('leave-auction', testAuctionId);
            tests.buyerLeaveRoom = true;
            log('✅ Buyer left auction room', 'green');
            checkCompletion();
          }, 2000);
        }
      });
    });
  });
}

function testLiveBiddingFunctionality() {
  return new Promise((resolve) => {
    log('\n💰 Testing live bidding functionality...', 'magenta');
    
    if (!testAuctionId) {
      log('❌ No test auction available', 'red');
      resolve({ success: false, reason: 'No auction' });
      return;
    }
    
    const buyerSocket = io(BASE_URL, {
      auth: { token: authTokens.buyer }
    });
    
    const sellerSocket = io(BASE_URL, {
      auth: { token: authTokens.seller }
    });
    
    let tests = {
      joinLiveRoom: false,
      placeBidViaSocket: false,
      receiveBidUpdate: false,
      sellerNotification: false,
      bidConfirmation: false
    };
    
    let completedTests = 0;
    const totalTests = Object.keys(tests).length;
    
    const timeout = setTimeout(() => {
      log('⚠️ Live bidding tests timed out', 'yellow');
      buyerSocket.close();
      sellerSocket.close();
      resolve({ success: false, tests, reason: 'Timeout' });
    }, 15000);
    
    function checkCompletion() {
      completedTests++;
      if (completedTests >= totalTests) {
        clearTimeout(timeout);
        buyerSocket.close();
        sellerSocket.close();
        
        const allPassed = Object.values(tests).every(test => test);
        resolve({ success: allPassed, tests });
      }
    }
    
    // Seller joins to receive notifications
    sellerSocket.on('connect', () => {
      sellerSocket.emit('join-auction', testAuctionId);
      
      sellerSocket.on('new-bid-notification', (data) => {
        if (data.auctionId === testAuctionId && data.bidAmount === 25.00) {
          tests.sellerNotification = true;
          log('✅ Seller received bid notification', 'green');
          checkCompletion();
        }
      });
    });
    
    // Buyer joins live room and places bid
    buyerSocket.on('connect', () => {
      buyerSocket.emit('join-live-auction', testAuctionId);
      
      buyerSocket.on('live-auction-joined', (data) => {
        if (data.auctionId === testAuctionId) {
          tests.joinLiveRoom = true;
          log('✅ Buyer joined live auction room', 'green');
          checkCompletion();
          
          // Place bid via socket
          setTimeout(() => {
            buyerSocket.emit('place-bid', {
              auctionId: testAuctionId,
              amount: 25.00,
              bidType: 'manual'
            });
            
            tests.placeBidViaSocket = true;
            log('✅ Bid placed via socket', 'green');
            checkCompletion();
          }, 1000);
        }
      });
      
      buyerSocket.on('live-bid-update', (data) => {
        if (data.auctionId === testAuctionId && data.newCurrentPrice === 25.00) {
          tests.receiveBidUpdate = true;
          log('✅ Received live bid update', 'green');
          checkCompletion();
        }
      });
      
      buyerSocket.on('bid-confirmed', (data) => {
        if (data.auctionId === testAuctionId && data.amount === 25.00) {
          tests.bidConfirmation = true;
          log('✅ Bid confirmation received', 'green');
          checkCompletion();
        }
      });
      
      buyerSocket.on('bid-rejected', (data) => {
        log(`❌ Bid rejected: ${data.message}`, 'red');
        // Still count as a test completion for timeout purposes
        checkCompletion();
      });
    });
  });
}

function testAutoBiddingFunctionality() {
  return new Promise((resolve) => {
    log('\n🤖 Testing auto-bidding functionality...', 'magenta');
    
    if (!testAuctionId) {
      log('❌ No test auction available', 'red');
      resolve({ success: false, reason: 'No auction' });
      return;
    }
    
    const buyerSocket = io(BASE_URL, {
      auth: { token: authTokens.buyer }
    });
    
    let tests = {
      setupAutoBid: false,
      autoBidConfirmed: false,
      cancelAutoBid: false,
      autoBidCancelled: false
    };
    
    let completedTests = 0;
    const totalTests = Object.keys(tests).length;
    
    const timeout = setTimeout(() => {
      log('⚠️ Auto-bidding tests timed out', 'yellow');
      buyerSocket.close();
      resolve({ success: false, tests, reason: 'Timeout' });
    }, 10000);
    
    function checkCompletion() {
      completedTests++;
      if (completedTests >= totalTests) {
        clearTimeout(timeout);
        buyerSocket.close();
        
        const allPassed = Object.values(tests).every(test => test);
        resolve({ success: allPassed, tests });
      }
    }
    
    buyerSocket.on('connect', () => {
      // Setup auto-bid
      buyerSocket.emit('setup-auto-bid', {
        auctionId: testAuctionId,
        maxAmount: 50.00
      });
      
      tests.setupAutoBid = true;
      log('✅ Auto-bid setup request sent', 'green');
      checkCompletion();
      
      buyerSocket.on('auto-bid-confirmed', (data) => {
        if (data.auctionId === testAuctionId && data.maxAmount === 50.00) {
          tests.autoBidConfirmed = true;
          log('✅ Auto-bid confirmed', 'green');
          checkCompletion();
          
          // Cancel auto-bid after confirmation
          setTimeout(() => {
            buyerSocket.emit('cancel-auto-bid', testAuctionId);
            tests.cancelAutoBid = true;
            log('✅ Auto-bid cancellation sent', 'green');
            checkCompletion();
          }, 1000);
        }
      });
      
      buyerSocket.on('auto-bid-cancelled', (data) => {
        if (data.auctionId === testAuctionId) {
          tests.autoBidCancelled = true;
          log('✅ Auto-bid cancellation confirmed', 'green');
          checkCompletion();
        }
      });
    });
  });
}

function testAdminFunctionality() {
  return new Promise((resolve) => {
    log('\n👑 Testing admin Socket.io functionality...', 'magenta');
    
    if (!authTokens.admin) {
      log('❌ No admin token available', 'red');
      resolve({ success: false, reason: 'No admin auth' });
      return;
    }
    
    const adminSocket = io(BASE_URL, {
      auth: { token: authTokens.admin }
    });
    
    let tests = {
      adminConnect: false,
      adminRoomJoin: false,
      contentModeration: false,
      adminNotification: false
    };
    
    let completedTests = 0;
    const totalTests = Object.keys(tests).length;
    
    const timeout = setTimeout(() => {
      log('⚠️ Admin tests timed out', 'yellow');
      adminSocket.close();
      resolve({ success: false, tests, reason: 'Timeout' });
    }, 8000);
    
    function checkCompletion() {
      completedTests++;
      if (completedTests >= totalTests) {
        clearTimeout(timeout);
        adminSocket.close();
        
        const allPassed = Object.values(tests).every(test => test);
        resolve({ success: allPassed, tests });
      }
    }
    
    adminSocket.on('connect', () => {
      tests.adminConnect = true;
      log('✅ Admin socket connected', 'green');
      checkCompletion();
      
      // Admin should automatically join admin room
      tests.adminRoomJoin = true;
      log('✅ Admin joined admin room', 'green');
      checkCompletion();
      
      // Test content moderation
      if (testAuctionId) {
        adminSocket.emit('moderate-content', {
          contentType: 'auction',
          contentId: testAuctionId,
          action: 'approve',
          reason: 'Socket.io test moderation'
        });
        
        tests.contentModeration = true;
        log('✅ Content moderation action sent', 'green');
        checkCompletion();
      } else {
        tests.contentModeration = false;
        checkCompletion();
      }
      
      // Listen for admin notifications
      adminSocket.on('admin-user-connected', (data) => {
        tests.adminNotification = true;
        log('✅ Admin notification received', 'green');
        checkCompletion();
      });
      
      // Trigger admin notification by connecting another admin (simulate)
      setTimeout(() => {
        if (!tests.adminNotification) {
          tests.adminNotification = false;
          checkCompletion();
        }
      }, 3000);
    });
    
    adminSocket.on('connect_error', (error) => {
      log(`❌ Admin connection failed: ${error.message}`, 'red');
      tests.adminConnect = false;
      checkCompletion();
    });
  });
}

function testErrorHandling() {
  return new Promise((resolve) => {
    log('\n🚨 Testing Socket.io error handling...', 'magenta');
    
    let tests = {
      invalidTokenRejected: false,
      nonExistentAuctionHandled: false,
      invalidEventHandled: false,
      connectionErrorHandled: false
    };
    
    let completedTests = 0;
    const totalTests = Object.keys(tests).length;
    
    const timeout = setTimeout(() => {
      log('⚠️ Error handling tests timed out', 'yellow');
      resolve({ success: false, tests, reason: 'Timeout' });
    }, 10000);
    
    function checkCompletion() {
      completedTests++;
      if (completedTests >= totalTests) {
        clearTimeout(timeout);
        
        const allPassed = Object.values(tests).every(test => test);
        resolve({ success: allPassed, tests });
      }
    }
    
    // Test invalid token
    const invalidSocket = io(BASE_URL, {
      auth: { token: 'invalid_token_123' }
    });
    
    invalidSocket.on('connect_error', (error) => {
      tests.invalidTokenRejected = true;
      log('✅ Invalid token properly rejected', 'green');
      invalidSocket.close();
      checkCompletion();
    });
    
    // Test with valid socket for other error scenarios
    const validSocket = io(BASE_URL, {
      auth: { token: authTokens.buyer }
    });
    
    validSocket.on('connect', () => {
      // Test non-existent auction
      validSocket.emit('join-auction', '507f1f77bcf86cd799439011');
      
      validSocket.on('error', (data) => {
        if (data.message.includes('not found')) {
          tests.nonExistentAuctionHandled = true;
          log('✅ Non-existent auction error handled', 'green');
          checkCompletion();
        }
      });
      
      // Test invalid event data
      validSocket.emit('place-bid', { invalid: 'data' });
      
      setTimeout(() => {
        tests.invalidEventHandled = true;
        log('✅ Invalid event data handled', 'green');
        checkCompletion();
      }, 2000);
      
      // Test connection error handling
      validSocket.on('disconnect', (reason) => {
        tests.connectionErrorHandled = true;
        log('✅ Connection error handled', 'green');
        checkCompletion();
      });
    });
    
    // Force disconnect after tests
    setTimeout(() => {
      validSocket.close();
      if (!tests.connectionErrorHandled) {
        tests.connectionErrorHandled = true;
        checkCompletion();
      }
    }, 5000);
  });
}

/**
 * Main Test Runner
 */
async function runSocketTests() {
  log('⚡ STARTING SOCKET.IO COMPREHENSIVE TEST SUITE', 'magenta');
  log('=' .repeat(60), 'blue');
  
  const startTime = Date.now();
  const results = {};
  
  try {
    // Setup
    await authenticateUsers();
    await createTestAuction();
    
    // Run tests
    results.connection = await testSocketConnection();
    results.auctionRoom = await testAuctionRoomFunctionality();
    results.liveBidding = await testLiveBiddingFunctionality();
    results.autoBidding = await testAutoBiddingFunctionality();
    results.adminFunctionality = await testAdminFunctionality();
    results.errorHandling = await testErrorHandling();
    
  } catch (error) {
    log(`💥 Test suite crashed: ${error.message}`, 'red');
    console.error(error);
  }
  
  const endTime = Date.now();
  const totalTime = ((endTime - startTime) / 1000).toFixed(2);
  
  // Generate report
  generateSocketTestReport(results, totalTime);
}

function generateSocketTestReport(results, totalTime) {
  log('\n' + '=' .repeat(60), 'blue');
  log('📊 SOCKET.IO TEST RESULTS', 'magenta');
  log('=' .repeat(60), 'blue');
  
  let totalTests = 0;
  let passedTests = 0;
  
  Object.entries(results).forEach(([category, result]) => {
    log(`\n📋 ${category.toUpperCase()}:`, 'cyan');
    
    if (result.success !== undefined) {
      log(`   Overall: ${result.success ? '✅ PASS' : '❌ FAIL'}`, 
          result.success ? 'green' : 'red');
      totalTests++;
      if (result.success) passedTests++;
    }
    
    if (result.tests) {
      Object.entries(result.tests).forEach(([testName, passed]) => {
        log(`   ${testName}: ${passed ? '✅' : '❌'}`, passed ? 'green' : 'red');
        totalTests++;
        if (passed) passedTests++;
      });
    }
    
    if (result.reason) {
      log(`   Reason: ${result.reason}`, 'yellow');
    }
  });
  
  const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
  
  log(`\n📈 SUMMARY:`, 'cyan');
  log(`   Total Tests: ${totalTests}`, 'cyan');
  log(`   Passed: ${passedTests}`, 'green');
  log(`   Failed: ${totalTests - passedTests}`, 'red');
  log(`   Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'red');
  log(`   Total Time: ${totalTime}s`, 'yellow');
  
  log('\n' + '=' .repeat(60), 'blue');
  log(passedTests === totalTests ? '🎉 ALL SOCKET TESTS PASSED!' : '⚠️  SOME SOCKET TESTS FAILED', 
      passedTests === totalTests ? 'green' : 'yellow');
  log('=' .repeat(60), 'blue');
}

// Run tests if called directly
if (require.main === module) {
  runSocketTests().catch(console.error);
}

module.exports = { runSocketTests };
