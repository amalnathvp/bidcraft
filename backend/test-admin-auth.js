console.log('Testing admin authentication...');

const testLogin = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/register', {
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
    
    const data = await response.json();
    console.log('Registration response:', data);
    
    if (data.success) {
      console.log('✅ Admin user created successfully!');
      console.log('Now testing login...');
      
      // Test login
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
      
      const loginData = await loginResponse.json();
      console.log('Login response:', loginData);
      
      if (loginData.success) {
        console.log('✅ Admin login successful!');
        console.log('🎉 You can now login with:');
        console.log('📧 Email: admin@bidcraft.com');
        console.log('🔑 Password: Admin123');
      } else {
        console.log('❌ Admin login failed:', loginData.message);
      }
    } else {
      console.log('❌ Admin creation failed:', data.message);
      
      // If user already exists, try login directly
      if (data.message && data.message.includes('already exists')) {
        console.log('User exists, testing login...');
        
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
        
        const loginData = await loginResponse.json();
        console.log('Login test result:', loginData);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testLogin();
