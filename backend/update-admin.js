// Update admin user to have seller permissions for auction creation
const mongoose = require('mongoose');
require('dotenv').config();

async function updateAdminUser() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bidcraft');
    console.log('✅ Connected to MongoDB');
    
    const User = require('./src/models/User');
    
    // Find and update admin user
    const adminUser = await User.findOne({ email: 'admin@bidcraft.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found!');
      mongoose.connection.close();
      return;
    }
    
    console.log('👤 Current admin user:');
    console.log('📧 Email:', adminUser.email);
    console.log('🔑 Role:', adminUser.role);
    console.log('🟢 Active:', adminUser.isActive);
    console.log('✔️ Verified:', adminUser.isVerified);
    
    // Update user to ensure they can create auctions
    adminUser.role = 'admin'; // Keep admin role
    adminUser.isActive = true;
    adminUser.isVerified = true;
    
    // Add seller capabilities by setting shop details
    if (!adminUser.shopName) {
      adminUser.shopName = 'Admin Test Shop';
    }
    
    await adminUser.save();
    
    console.log('\n✅ Admin user updated successfully');
    console.log('📊 Updated role:', adminUser.role);
    console.log('🏪 Shop name:', adminUser.shopName);
    console.log('🟢 Active:', adminUser.isActive);
    console.log('✔️ Verified:', adminUser.isVerified);
    
    mongoose.connection.close();
    console.log('🔌 Connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
  }
}

updateAdminUser();
