// Quick test script to reproduce the token validation issue
const axios = require('axios');

async function testTokenValidation() {
  try {
    console.log('🔐 Testing admin login...');
    
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@bidcraft.com',
      password: 'Admin123'
    });

    console.log('Login response:', loginResponse.data);

    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log('🔑 Token received:', token ? 'Yes' : 'No');

    if (token) {
      console.log('\n📤 Testing auction creation...');
      
      const auctionData = {
        title: 'Test Handmade Vase',
        description: 'Beautiful ceramic vase',
        startingBid: 50,
        category: 'ceramics',
        condition: 'new',
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        shipping: {
          cost: 15,
          method: 'standard'
        }
      };

      const auctionResponse = await axios.post('http://localhost:5000/api/auctions', auctionData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Auction response status:', auctionResponse.status);
      console.log('Auction response:', auctionResponse.data);
      console.log('✅ Auction creation successful!');

    }

  } catch (error) {
    if (error.response) {
      console.log('❌ Request failed with status:', error.response.status);
      console.log('❌ Error message:', error.response.data.message);
      console.log('Full error response:', error.response.data);
    } else {
      console.error('❌ Network error:', error.message);
    }
  }
}

testTokenValidation();
