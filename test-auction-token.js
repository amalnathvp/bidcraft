// Direct test of auction creation with token validation
const axios = require('axios');

async function testAuctionCreationWithAuth() {
  try {
    console.log('🔐 Step 1: Testing login...');
    
    // Login to get token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@bidcraft.com', 
      password: 'Admin123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    
    console.log('✅ Login successful');
    console.log('👤 User:', user.name, '-', user.role);
    console.log('🔑 Token length:', token.length);
    console.log('🔑 Token preview:', token.substring(0, 20) + '...');
    
    // Verify token by getting user profile
    console.log('\n🔍 Step 2: Verifying token with /api/auth/me...');
    
    const meResponse = await axios.get('http://localhost:5000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Token verification successful');
    console.log('👤 Profile user:', meResponse.data.user.name);
    
    // Test auction creation
    console.log('\n📤 Step 3: Testing auction creation...');
    
    const auctionData = {
      title: 'Test Handmade Ceramic Vase',
      description: 'Beautiful handcrafted ceramic vase with traditional patterns',
      startingBid: 25,
      category: 'ceramics',
      condition: 'new',
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      shipping: {
        cost: 12,
        method: 'standard'
      }
    };
    
    console.log('🎯 Attempting to create auction with data:', {
      title: auctionData.title,
      startingBid: auctionData.startingBid,
      category: auctionData.category
    });
    
    const auctionResponse = await axios.post('http://localhost:5000/api/auctions', auctionData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Auction creation successful!');
    console.log('🎉 Created auction:', auctionResponse.data.data.title);
    console.log('🆔 Auction ID:', auctionResponse.data.data._id);
    console.log('💰 Starting bid:', auctionResponse.data.data.startingBid);
    
  } catch (error) {
    if (error.response) {
      console.log('\n❌ Request failed');
      console.log('🔢 Status:', error.response.status);
      console.log('📝 Message:', error.response.data.message);
      console.log('📋 Full response:', JSON.stringify(error.response.data, null, 2));
      
      // If it's a token issue, let's analyze
      if (error.response.status === 401) {
        console.log('\n🔍 Analyzing token issue...');
        console.log('Authorization header sent:', error.config.headers.Authorization ? 'Yes' : 'No');
        if (error.config.headers.Authorization) {
          console.log('Header format:', error.config.headers.Authorization.substring(0, 20) + '...');
        }
      }
    } else {
      console.error('❌ Network/Server error:', error.message);
    }
  }
}

testAuctionCreationWithAuth();
