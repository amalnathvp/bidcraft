/**
 * Comprehensive API Test Suite for BidCraft Backend
 * Tests all major endpoints including real-time functionality
 * 
 * Usage: node tests/api-test-suite.js
 * 
 * Prerequisites:
 * - Backend server running on http://localhost:5000
 * - MongoDB connected and accessible
 * - Socket.io service initialized
 */

const fetch = require('node-fetch');
const io = require('socket.io-client');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Test users data
const testUsers = {
  buyer: {
    email: 'testbuyer@example.com',
    password: 'testpass123',
    name: 'Test Buyer',
    role: 'buyer'
  },
  seller: {
    email: 'testseller@example.com',
    password: 'testpass123',
    name: 'Test Seller',
    role: 'seller'
  },
  admin: {
    email: 'testadmin@example.com',
    password: 'testpass123',
    name: 'Test Admin',
    role: 'admin'
  }
};

// Store authentication tokens and created resource IDs
let authTokens = {};
let createdResources = {
  users: {},
  auctions: [],
  bids: [],
  categories: []
};

/**
 * Utility Functions
 */

// Color codes for console output
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

function logTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`✅ ${testName}`, 'green');
  } else {
    testResults.failed++;
    log(`❌ ${testName}`, 'red');
    if (details) log(`   ${details}`, 'yellow');
  }
  
  testResults.details.push({
    name: testName,
    passed,
    details
  });
}

async function makeRequest(endpoint, options = {}) {
  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      status: response.status,
      ok: response.ok,
      data,
      headers: response.headers
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test Suites
 */

// 1. Server Health Check
async function testServerHealth() {
  log('\n🏥 TESTING SERVER HEALTH', 'cyan');
  
  const response = await makeRequest('/health');
  logTest('Health endpoint responds', response.ok && response.status === 200);
  
  if (response.ok) {
    logTest('Health response contains status', response.data.status === 'OK');
    logTest('Health response contains timestamp', !!response.data.timestamp);
  }
}

// 2. Authentication Tests
async function testAuthentication() {
  log('\n🔐 TESTING AUTHENTICATION', 'cyan');
  
  // Test user registration
  for (const [userType, userData] of Object.entries(testUsers)) {
    const response = await makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    if (response.ok) {
      logTest(`${userType} registration successful`, true);
      createdResources.users[userType] = response.data.user;
      authTokens[userType] = response.data.token;
    } else {
      // Try login if user already exists
      const loginResponse = await makeRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: userData.email,
          password: userData.password
        })
      });
      
      if (loginResponse.ok) {
        logTest(`${userType} login successful`, true);
        createdResources.users[userType] = loginResponse.data.user;
        authTokens[userType] = loginResponse.data.token;
      } else {
        logTest(`${userType} authentication failed`, false, response.data?.message || 'Unknown error');
      }
    }
  }
  
  // Test protected route access
  const protectedResponse = await makeRequest('/users/me/dashboard', {
    headers: {
      'Authorization': `Bearer ${authTokens.buyer}`
    }
  });
  
  logTest('Protected route accessible with token', protectedResponse.ok);
  
  // Test invalid token
  const invalidTokenResponse = await makeRequest('/users/me/dashboard', {
    headers: {
      'Authorization': 'Bearer invalid_token'
    }
  });
  
  logTest('Protected route blocks invalid token', !invalidTokenResponse.ok);
}

// 3. Category Tests
async function testCategories() {
  log('\n📂 TESTING CATEGORIES', 'cyan');
  
  // Get categories
  const categoriesResponse = await makeRequest('/categories');
  logTest('Get categories endpoint works', categoriesResponse.ok);
  
  if (categoriesResponse.ok && categoriesResponse.data.data) {
    logTest('Categories data structure correct', Array.isArray(categoriesResponse.data.data));
    
    if (categoriesResponse.data.data.length > 0) {
      const firstCategory = categoriesResponse.data.data[0];
      logTest('Category has required fields', 
        firstCategory.name && firstCategory._id);
    }
  }
  
  // Test category tree
  const treeResponse = await makeRequest('/categories/tree');
  logTest('Category tree endpoint works', treeResponse.ok);
}

// 4. Auction Tests
async function testAuctions() {
  log('\n🏺 TESTING AUCTIONS', 'cyan');
  
  // Get all auctions
  const auctionsResponse = await makeRequest('/auctions');
  logTest('Get auctions endpoint works', auctionsResponse.ok);
  
  if (auctionsResponse.ok) {
    logTest('Auctions response has correct structure', 
      auctionsResponse.data.success && Array.isArray(auctionsResponse.data.data));
  }
  
  // Create auction (seller only)
  const auctionData = {
    title: 'Test Auction Item',
    description: 'This is a test auction item created by the API test suite. It includes all required fields and should be valid for bidding.',
    category: 'Electronics',
    condition: 'new',
    startingPrice: 10.00,
    buyNowPrice: 100.00,
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
  };
  
  const createAuctionResponse = await makeRequest('/auctions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authTokens.seller}`
    },
    body: JSON.stringify(auctionData)
  });
  
  if (createAuctionResponse.ok) {
    logTest('Seller can create auction', true);
    createdResources.auctions.push(createAuctionResponse.data.data);
  } else {
    logTest('Seller auction creation failed', false, 
      createAuctionResponse.data?.message || 'Unknown error');
  }
  
  // Test buyer cannot create auction
  const buyerCreateResponse = await makeRequest('/auctions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authTokens.buyer}`
    },
    body: JSON.stringify(auctionData)
  });
  
  logTest('Buyer cannot create auction', !buyerCreateResponse.ok);
  
  // Get specific auction
  if (createdResources.auctions.length > 0) {
    const auctionId = createdResources.auctions[0]._id;
    const singleAuctionResponse = await makeRequest(`/auctions/${auctionId}`);
    logTest('Get single auction works', singleAuctionResponse.ok);
    
    if (singleAuctionResponse.ok) {
      logTest('Single auction has correct data', 
        singleAuctionResponse.data.data.title === auctionData.title);
    }
  }
}

// 5. Bid Tests
async function testBidding() {
  log('\n💰 TESTING BIDDING SYSTEM', 'cyan');
  
  if (createdResources.auctions.length === 0) {
    logTest('Bidding tests skipped', false, 'No auctions available for testing');
    return;
  }
  
  const auctionId = createdResources.auctions[0]._id;
  
  // Get auction bids
  const bidsResponse = await makeRequest(`/bids/auction/${auctionId}`);
  logTest('Get auction bids endpoint works', bidsResponse.ok);
  
  // Place a bid
  const bidData = {
    amount: 15.00,
    bidType: 'manual'
  };
  
  const placeBidResponse = await makeRequest(`/bids/${auctionId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authTokens.buyer}`
    },
    body: JSON.stringify(bidData)
  });
  
  if (placeBidResponse.ok) {
    logTest('Buyer can place bid', true);
    createdResources.bids.push(placeBidResponse.data.data.bid);
  } else {
    logTest('Bid placement failed', false, 
      placeBidResponse.data?.message || 'Unknown error');
  }
  
  // Test seller cannot bid on own auction
  const sellerBidResponse = await makeRequest(`/bids/${auctionId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authTokens.seller}`
    },
    body: JSON.stringify(bidData)
  });
  
  logTest('Seller cannot bid on own auction', !sellerBidResponse.ok);
  
  // Get user bids
  const myBidsResponse = await makeRequest('/bids/user/my-bids', {
    headers: {
      'Authorization': `Bearer ${authTokens.buyer}`
    }
  });
  
  logTest('Get user bids works', myBidsResponse.ok);
  
  // Test buy now functionality
  const buyNowBidResponse = await makeRequest(`/bids/${auctionId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authTokens.buyer}`
    },
    body: JSON.stringify({
      amount: 100.00,
      bidType: 'buy_now'
    })
  });
  
  if (buyNowBidResponse.ok) {
    logTest('Buy now functionality works', true);
  } else {
    logTest('Buy now failed', false, 
      buyNowBidResponse.data?.message || 'Unknown error');
  }
}

// 6. User Management Tests
async function testUserManagement() {
  log('\n👥 TESTING USER MANAGEMENT', 'cyan');
  
  // Get user dashboard
  const dashboardResponse = await makeRequest('/users/me/dashboard', {
    headers: {
      'Authorization': `Bearer ${authTokens.buyer}`
    }
  });
  
  logTest('User dashboard accessible', dashboardResponse.ok);
  
  // Get watchlist
  const watchlistResponse = await makeRequest('/users/me/watchlist', {
    headers: {
      'Authorization': `Bearer ${authTokens.buyer}`
    }
  });
  
  logTest('User watchlist accessible', watchlistResponse.ok);
  
  // Get purchase history
  const purchaseHistoryResponse = await makeRequest('/users/me/purchase-history', {
    headers: {
      'Authorization': `Bearer ${authTokens.buyer}`
    }
  });
  
  logTest('Purchase history accessible', purchaseHistoryResponse.ok);
  
  // Get selling history (seller only)
  const sellingHistoryResponse = await makeRequest('/users/me/selling-history', {
    headers: {
      'Authorization': `Bearer ${authTokens.seller}`
    }
  });
  
  logTest('Selling history accessible to seller', sellingHistoryResponse.ok);
  
  // Test buyer cannot access selling history
  const buyerSellingResponse = await makeRequest('/users/me/selling-history', {
    headers: {
      'Authorization': `Bearer ${authTokens.buyer}`
    }
  });
  
  logTest('Buyer cannot access selling history', !buyerSellingResponse.ok);
}

// 7. Admin Tests
async function testAdminFunctionality() {
  log('\n👑 TESTING ADMIN FUNCTIONALITY', 'cyan');
  
  // Admin dashboard
  const adminDashboardResponse = await makeRequest('/admin/dashboard', {
    headers: {
      'Authorization': `Bearer ${authTokens.admin}`
    }
  });
  
  logTest('Admin dashboard accessible', adminDashboardResponse.ok);
  
  // Get all users (admin only)
  const allUsersResponse = await makeRequest('/admin/users', {
    headers: {
      'Authorization': `Bearer ${authTokens.admin}`
    }
  });
  
  logTest('Admin can get all users', allUsersResponse.ok);
  
  // Test non-admin cannot access admin routes
  const buyerAdminResponse = await makeRequest('/admin/dashboard', {
    headers: {
      'Authorization': `Bearer ${authTokens.buyer}`
    }
  });
  
  logTest('Non-admin blocked from admin routes', !buyerAdminResponse.ok);
  
  // Get recent activities
  const activitiesResponse = await makeRequest('/admin/activities', {
    headers: {
      'Authorization': `Bearer ${authTokens.admin}`
    }
  });
  
  logTest('Admin activities endpoint works', activitiesResponse.ok);
}

// 8. Socket.io Real-time Tests
async function testSocketIO() {
  log('\n⚡ TESTING SOCKET.IO REAL-TIME FUNCTIONALITY', 'cyan');
  
  return new Promise((resolve) => {
    let testsCompleted = 0;
    const totalSocketTests = 5;
    
    // Test buyer socket connection
    const buyerSocket = io(BASE_URL, {
      auth: {
        token: authTokens.buyer
      }
    });
    
    // Test seller socket connection
    const sellerSocket = io(BASE_URL, {
      auth: {
        token: authTokens.seller
      }
    });
    
    let buyerConnected = false;
    let sellerConnected = false;
    
    buyerSocket.on('connect', () => {
      buyerConnected = true;
      logTest('Buyer socket connection successful', true);
      testsCompleted++;
      checkCompletion();
    });
    
    buyerSocket.on('connect_error', (error) => {
      logTest('Buyer socket connection failed', false, error.message);
      testsCompleted++;
      checkCompletion();
    });
    
    sellerSocket.on('connect', () => {
      sellerConnected = true;
      logTest('Seller socket connection successful', true);
      testsCompleted++;
      checkCompletion();
    });
    
    sellerSocket.on('connect_error', (error) => {
      logTest('Seller socket connection failed', false, error.message);
      testsCompleted++;
      checkCompletion();
    });
    
    // Test joining auction room
    setTimeout(() => {
      if (buyerConnected && createdResources.auctions.length > 0) {
        const auctionId = createdResources.auctions[0]._id;
        
        buyerSocket.emit('join-auction', auctionId);
        
        buyerSocket.on('auction-joined', (data) => {
          logTest('Auction room join successful', data.auctionId === auctionId);
          testsCompleted++;
          checkCompletion();
        });
      } else {
        logTest('Auction room join test skipped', false, 'No socket connection or auctions');
        testsCompleted++;
        checkCompletion();
      }
    }, 1000);
    
    // Test real-time bid updates
    setTimeout(() => {
      if (buyerConnected && sellerConnected && createdResources.auctions.length > 0) {
        const auctionId = createdResources.auctions[0]._id;
        
        // Seller joins auction room to receive bid updates
        sellerSocket.emit('join-auction', auctionId);
        
        // Listen for bid updates on seller socket
        sellerSocket.on('new-bid-notification', (data) => {
          logTest('Real-time bid notification received', 
            data.auctionId === auctionId && data.bidAmount);
          testsCompleted++;
          checkCompletion();
        });
        
        // Buyer places bid via socket
        setTimeout(() => {
          buyerSocket.emit('place-bid', {
            auctionId: auctionId,
            amount: 20.00,
            bidType: 'manual'
          });
        }, 500);
      } else {
        logTest('Real-time bid test skipped', false, 'Sockets not connected or no auctions');
        testsCompleted++;
        checkCompletion();
      }
    }, 2000);
    
    // Test heartbeat
    setTimeout(() => {
      if (buyerConnected) {
        buyerSocket.emit('heartbeat');
        
        buyerSocket.on('heartbeat-ack', (data) => {
          logTest('Socket heartbeat works', !!data.timestamp);
          testsCompleted++;
          checkCompletion();
        });
      } else {
        logTest('Socket heartbeat test skipped', false, 'Socket not connected');
        testsCompleted++;
        checkCompletion();
      }
    }, 3000);
    
    function checkCompletion() {
      if (testsCompleted >= totalSocketTests) {
        buyerSocket.close();
        sellerSocket.close();
        resolve();
      }
    }
    
    // Timeout after 10 seconds
    setTimeout(() => {
      while (testsCompleted < totalSocketTests) {
        logTest(`Socket test ${testsCompleted + 1}`, false, 'Test timed out');
        testsCompleted++;
      }
      buyerSocket.close();
      sellerSocket.close();
      resolve();
    }, 10000);
  });
}

// 9. Error Handling Tests
async function testErrorHandling() {
  log('\n🚨 TESTING ERROR HANDLING', 'cyan');
  
  // Test 404 for non-existent auction
  const nonExistentResponse = await makeRequest('/auctions/507f1f77bcf86cd799439011');
  logTest('Non-existent auction returns 404', nonExistentResponse.status === 404);
  
  // Test malformed request
  const malformedResponse = await makeRequest('/auctions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authTokens.seller}`
    },
    body: JSON.stringify({ invalid: 'data' })
  });
  
  logTest('Malformed request handled gracefully', !malformedResponse.ok);
  
  // Test unauthorized access
  const unauthorizedResponse = await makeRequest('/admin/dashboard');
  logTest('Unauthorized access blocked', unauthorizedResponse.status === 401);
  
  // Test invalid JSON
  const invalidJSONResponse = await makeRequest('/auctions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authTokens.seller}`
    },
    body: 'invalid json'
  });
  
  logTest('Invalid JSON handled', !invalidJSONResponse.ok);
}

// 10. Performance Tests (Basic)
async function testPerformance() {
  log('\n⚡ TESTING BASIC PERFORMANCE', 'cyan');
  
  const startTime = Date.now();
  const responses = await Promise.all([
    makeRequest('/auctions'),
    makeRequest('/categories'),
    makeRequest('/health'),
    makeRequest('/auctions/featured'),
    makeRequest('/auctions/ending-soon')
  ]);
  const endTime = Date.now();
  
  const allSuccessful = responses.every(r => r.ok);
  const totalTime = endTime - startTime;
  
  logTest('Multiple concurrent requests successful', allSuccessful);
  logTest('Response time reasonable', totalTime < 5000, `Total time: ${totalTime}ms`);
  
  // Test pagination
  const paginatedResponse = await makeRequest('/auctions?page=1&limit=5');
  logTest('Pagination works', paginatedResponse.ok && 
    paginatedResponse.data.pagination);
}

/**
 * Main Test Runner
 */
async function runAllTests() {
  log('🚀 STARTING COMPREHENSIVE API TEST SUITE', 'magenta');
  log('=' .repeat(60), 'blue');
  
  const startTime = Date.now();
  
  try {
    await testServerHealth();
    await testAuthentication();
    await testCategories();
    await testAuctions();
    await testBidding();
    await testUserManagement();
    await testAdminFunctionality();
    await testSocketIO();
    await testErrorHandling();
    await testPerformance();
  } catch (error) {
    log(`\n💥 Test suite crashed: ${error.message}`, 'red');
    console.error(error);
  }
  
  const endTime = Date.now();
  const totalTime = ((endTime - startTime) / 1000).toFixed(2);
  
  // Generate test report
  generateTestReport(totalTime);
}

function generateTestReport(totalTime) {
  log('\n' + '=' .repeat(60), 'blue');
  log('📊 TEST RESULTS SUMMARY', 'magenta');
  log('=' .repeat(60), 'blue');
  
  log(`\n📈 Total Tests: ${testResults.total}`, 'cyan');
  log(`✅ Passed: ${testResults.passed}`, 'green');
  log(`❌ Failed: ${testResults.failed}`, 'red');
  log(`⏱️  Total Time: ${totalTime}s`, 'yellow');
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  log(`📊 Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'red');
  
  // Save detailed report to file
  const reportData = {
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: successRate + '%',
      totalTime: totalTime + 's',
      timestamp: new Date().toISOString()
    },
    details: testResults.details,
    createdResources
  };
  
  const reportPath = path.join(__dirname, `test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  log(`\n📝 Detailed report saved to: ${reportPath}`, 'cyan');
  
  if (testResults.failed > 0) {
    log('\n⚠️  FAILED TESTS:', 'yellow');
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => {
        log(`   • ${test.name}`, 'red');
        if (test.details) log(`     ${test.details}`, 'yellow');
      });
  }
  
  log('\n' + '=' .repeat(60), 'blue');
  log(testResults.failed === 0 ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED', 
    testResults.failed === 0 ? 'green' : 'yellow');
  log('=' .repeat(60), 'blue');
}

// Check if running directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testResults,
  makeRequest
};
