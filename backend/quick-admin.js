// Quick admin setup
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function setupAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bidcraft');
    console.log('Connected to MongoDB');
    
    // Define User schema (simplified)
    const userSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      isVerified: Boolean,
      isActive: Boolean
    }, { 
      collection: 'users',
      timestamps: true 
    });
    
    const User = mongoose.model('User', userSchema);
    
    // Delete existing admin
    await User.deleteOne({ email: 'admin@bidcraft.com' });
    console.log('Cleared existing admin');
    
    // Hash password manually
    const hashedPassword = await bcrypt.hash('admin123', 12);
    console.log('Password hashed');
    
    // Create admin
    await User.create({
      name: 'Admin User',
      email: 'admin@bidcraft.com',
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
      isActive: true
    });
    
    console.log('✅ Admin created successfully!');
    console.log('📧 Email: admin@bidcraft.com');
    console.log('🔑 Password: admin123');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

setupAdmin();
