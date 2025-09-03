// Test to check admin user configuration and JWT token validation
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function checkAdminUser() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bidcraft');
    console.log('✅ Connected to MongoDB');
    
    const User = require('./src/models/User');
    
    // Check if admin user exists
    console.log('\n👤 Checking admin user...');
    const adminUser = await User.findOne({ email: 'admin@bidcraft.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found!');
      return;
    }
    
    console.log('✅ Admin user found');
    console.log('📧 Email:', adminUser.email);
    console.log('🔑 Role:', adminUser.role);
    console.log('🟢 Active:', adminUser.isActive);
    console.log('✔️ Verified:', adminUser.isVerified);
    
    // Test JWT token generation
    console.log('\n🔐 Testing JWT token generation...');
    const testToken = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });
    
    console.log('✅ Token generated successfully');
    console.log('🔑 Token length:', testToken.length);
    console.log('🔑 Token preview:', testToken.substring(0, 30) + '...');
    
    // Test JWT token verification
    console.log('\n🔍 Testing JWT token verification...');
    const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
    console.log('✅ Token verification successful');
    console.log('👤 Decoded user ID:', decoded.id);
    console.log('🕐 Token expires:', new Date(decoded.exp * 1000));
    
    // Test user lookup from token
    console.log('\n🔍 Testing user lookup from token...');
    const tokenUser = await User.findById(decoded.id).select('-password');
    
    if (tokenUser) {
      console.log('✅ User found from token');
      console.log('👤 Name:', tokenUser.name);
      console.log('🔑 Role:', tokenUser.role);
      console.log('🟢 Active:', tokenUser.isActive);
    } else {
      console.log('❌ User not found from token!');
    }
    
    mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

checkAdminUser();
