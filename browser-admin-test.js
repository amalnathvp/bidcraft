// Simple test to register admin through the signup page
// Open browser console and run this code

fetch('http://localhost:5000/api/auth/register', {
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
})
.then(response => response.json())
.then(data => {
  console.log('Registration result:', data);
  if (data.success) {
    console.log('✅ Admin created! Now testing login...');
    
    return fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@bidcraft.com',
        password: 'Admin123'
      })
    });
  } else {
    throw new Error(data.message || 'Registration failed');
  }
})
.then(response => response.json())
.then(loginData => {
  console.log('Login result:', loginData);
  if (loginData.success) {
    console.log('✅ Admin login successful!');
    console.log('User role:', loginData.user.role);
    localStorage.setItem('authToken', loginData.token);
    localStorage.setItem('user', JSON.stringify(loginData.user));
    console.log('✅ Stored auth data. You can now access /admin');
  }
})
.catch(error => {
  console.error('❌ Error:', error);
});
