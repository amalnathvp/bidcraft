const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing admin login...');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@bidcraft.com',
      password: 'Admin123'
    });
    
    console.log('✅ Login successful!');
    console.log('User:', response.data.user);
    console.log('Token received:', !!response.data.token);
    
  } catch (error) {
    if (error.response) {
      console.error('❌ Login failed:', error.response.data);
      console.error('Status:', error.response.status);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testLogin();
