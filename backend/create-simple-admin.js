const mongoose = require('mongoose');
require('dotenv').config();

// Simple User schema for testing
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'buyer' },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/bidcraft');
    console.log('✅ Connected to MongoDB');
    
    // Remove existing admin
    const deleted = await User.deleteOne({ email: 'admin@bidcraft.com' });
    console.log('🗑️ Removed existing admin:', deleted.deletedCount);
    
    // Create new admin
    const admin = new User({
      name: 'Admin User',
      email: 'admin@bidcraft.com',
      password: 'admin123',
      role: 'admin',
      isVerified: true,
      isActive: true
    });
    
    await admin.save();
    console.log('✅ Admin user created successfully!');
    
    // Test the password immediately
    const testAdmin = await User.findOne({ email: 'admin@bidcraft.com' });
    const passwordWorks = await testAdmin.comparePassword('admin123');
    console.log('🔐 Password test result:', passwordWorks);
    
    console.log('📧 Login credentials:');
    console.log('   Email: admin@bidcraft.com');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

createAdmin();
