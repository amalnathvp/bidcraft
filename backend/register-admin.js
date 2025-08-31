const axios = require('axios');

async function createAdmin() {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Admin User',
      email: 'admin@bidcraft.com',
      password: 'Admin123',
      role: 'admin'
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@bidcraft.com');
    console.log('🔑 Password: Admin123');
    console.log('Response:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.error('❌ Registration failed:', error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

createAdmin();
