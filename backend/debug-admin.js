const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

console.log('🚀 Starting admin creation...');

async function createAdmin() {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/bidcraft');
    console.log('✅ Connected to MongoDB');
    
    const User = require('./src/models/User');
    console.log('📋 User model loaded');
    
    // Remove existing admin
    console.log('🗑️ Removing existing admin...');
    const deleteResult = await User.deleteOne({ email: 'admin@bidcraft.com' });
    console.log('Deleted count:', deleteResult.deletedCount);
    
    // Create admin user using the model's create method
    console.log('👤 Creating new admin user...');
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@bidcraft.com', 
      password: 'admin123',
      role: 'admin',
      isVerified: true,
      isActive: true
    });
    
    console.log('✅ Admin user created with ID:', adminUser._id);
    
    // Verify the user can be found and password works
    console.log('🔍 Testing login...');
    const foundUser = await User.findOne({ email: 'admin@bidcraft.com' }).select('+password');
    
    if (foundUser) {
      console.log('✅ User found in database');
      const passwordTest = await foundUser.comparePassword('admin123');
      console.log('🔐 Password test result:', passwordTest);
      
      console.log('📝 User details:');
      console.log('   Email:', foundUser.email);
      console.log('   Role:', foundUser.role);
      console.log('   Active:', foundUser.isActive);
      console.log('   Verified:', foundUser.isVerified);
    } else {
      console.log('❌ User not found after creation');
    }
    
    console.log('🎉 Admin creation complete!');
    console.log('📧 Login with: admin@bidcraft.com / admin123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Connection closed');
  }
}

createAdmin();
