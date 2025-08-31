const fetch = require('node-fetch');

async function createAdminAndTest() {
  try {
    console.log('Step 1: Testing server connectivity...');
    
    // Test server health
    const healthResponse = await fetch('http://localhost:5000/health');
    const healthData = await healthResponse.json();
    console.log('✅ Server is running:', healthData.status);
    
    console.log('\nStep 2: Attempting to register admin user...');
    
    // Try to register admin
    const registerResponse = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Admin User',
        email: 'admin@bidcraft.com',
        password: 'Admin123',
        role: 'admin'
      })
    });
    
    const registerData = await registerResponse.text();
    
    if (registerResponse.ok) {
      console.log('✅ Admin registration successful!');
      console.log('Response:', registerData);
    } else {
      console.log('⚠️ Registration response status:', registerResponse.status);
      console.log('Registration response:', registerData);
    }
    
    console.log('\nStep 3: Testing admin login...');
    
    // Try to login as admin
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@bidcraft.com',
        password: 'Admin123'
      })
    });
    
    const loginData = await loginResponse.text();
    
    if (loginResponse.ok) {
      console.log('✅ Admin login successful!');
      const parsedLogin = JSON.parse(loginData);
      console.log('User role:', parsedLogin.user?.role);
      console.log('User name:', parsedLogin.user?.name);
    } else {
      console.log('❌ Login failed with status:', loginResponse.status);
      console.log('Login response:', loginData);
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  }
}

createAdminAndTest();
