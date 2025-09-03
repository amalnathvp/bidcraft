// Quick script to ensure admin user is properly configured for auction creation
const mongoose = require('mongoose');
require('dotenv').config();

async function fixAdminUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bidcraft');
    console.log('Connected to MongoDB');
    
    const User = require('./src/models/User');
    
    // Find admin user
    let admin = await User.findOne({email: "admin@bidcraft.com"});
    
    if (!admin) {
      console.log('❌ Admin user not found');
      mongoose.connection.close();
      return;
    }
    
    console.log('Current admin user:');
    console.log('- Role:', admin.role);
    console.log('- Active:', admin.isActive);
    console.log('- Verified:', admin.isVerified);
    console.log('- Shop Name:', admin.shopName);
    
    // Update admin user to ensure auction creation works
    admin.role = "admin";
    admin.isActive = true;
    admin.isVerified = true;
    if (!admin.shopName) {
      admin.shopName = "Admin Shop";
    }
    
    await admin.save();
    
    console.log('✅ Admin user updated successfully');
    console.log('Updated properties:');
    console.log('- Role:', admin.role);
    console.log('- Active:', admin.isActive); 
    console.log('- Verified:', admin.isVerified);
    console.log('- Shop Name:', admin.shopName);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    mongoose.connection.close();
  }
}

fixAdminUser();
