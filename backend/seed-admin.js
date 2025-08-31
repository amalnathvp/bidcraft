const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB and create admin user
async function seedAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://127.0.0.1:27017/bidcraft');
    console.log('✅ Connected to MongoDB');

    // Define User schema (matching the backend model)
    const userSchema = new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
      isVerified: { type: Boolean, default: false },
      isActive: { type: Boolean, default: true }
    }, { timestamps: true });

    // Pre-save middleware to hash password
    userSchema.pre('save', async function(next) {
      if (!this.isModified('password')) return next();
      
      try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
      } catch (error) {
        next(error);
      }
    });

    // Method to compare password
    userSchema.methods.comparePassword = async function(candidatePassword) {
      return await bcrypt.compare(candidatePassword, this.password);
    };

    const User = mongoose.model('User', userSchema);

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@bidcraft.com' });
    
    if (existingAdmin) {
      console.log('ℹ️ Admin user already exists');
      console.log('📧 Email: admin@bidcraft.com');
      console.log('🔐 Role:', existingAdmin.role);
      
      // Test password
      const isPasswordValid = await existingAdmin.comparePassword('Admin123');
      console.log('🔑 Password test:', isPasswordValid ? 'VALID' : 'INVALID');
      
      if (!isPasswordValid) {
        console.log('Updating admin password...');
        existingAdmin.password = 'Admin123';
        await existingAdmin.save();
        console.log('✅ Admin password updated');
      }
      
    } else {
      console.log('Creating new admin user...');
      
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@bidcraft.com',
        password: 'Admin123',
        role: 'admin',
        isVerified: true,
        isActive: true
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully!');
    }
    
    console.log('\n=== ADMIN CREDENTIALS ===');
    console.log('📧 Email: admin@bidcraft.com');
    console.log('🔑 Password: Admin123');
    console.log('🔐 Role: admin');
    console.log('🌐 URL: http://localhost:3000/admin');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

seedAdmin();
