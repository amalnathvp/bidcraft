const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('bidcraft');
    const users = db.collection('users');
    
    // Check if admin exists
    const existingAdmin = await users.findOne({ email: 'admin@bidcraft.com' });
    
    if (existingAdmin) {
      console.log('ℹ️ Admin user already exists');
      console.log('📧 Email: admin@bidcraft.com');
      console.log('🔐 Role:', existingAdmin.role);
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('Admin123', 10);
    
    // Create admin user
    const adminUser = {
      name: 'Admin User',
      email: 'admin@bidcraft.com',
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await users.insertOne(adminUser);
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@bidcraft.com');
    console.log('🔑 Password: Admin123');
    console.log('🔐 Role: admin');
    console.log('🆔 ID:', result.insertedId);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

createAdmin();
