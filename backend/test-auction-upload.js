const axios = require('axios');

async function testAuctionUpload() {
  try {
    console.log('🔐 Step 1: Login to get token...');
    
    // First login to get a token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@bidcraft.com',
      password: 'Admin123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received');
    console.log('🔑 Token preview:', token.substring(0, 20) + '...');
    
    console.log('\n📤 Step 2: Attempting to upload auction...');
    
    // Try to create an auction
    const auctionData = {
      title: 'Test Handmade Vase',
      description: 'Beautiful ceramic vase made by local artisan',
      startingBid: 50,
      category: 'ceramics',
      condition: 'new',
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      shipping: {
        cost: 15,
        method: 'standard'
      }
    };
    
    const auctionResponse = await axios.post('http://localhost:5000/api/auctions', auctionData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Auction upload successful!');
    console.log('📋 Auction ID:', auctionResponse.data.data?._id);
    console.log('🏷️ Title:', auctionResponse.data.data?.title);
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Request failed with status:', error.response.status);
      console.log('📝 Error message:', error.response.data.message);
      console.log('🔍 Full error response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('❌ Network/Server error:', error.message);
    }
  }
}

// Run the test
testAuctionUpload();
