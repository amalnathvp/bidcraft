const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected successfully');
    
    const db = client.db('bidcraft');
    const usersCollection = db.collection('users');
    
    // Remove existing admin
    console.log('🗑️ Removing existing admin...');
    const deleteResult = await usersCollection.deleteOne({ email: 'admin@bidcraft.com' });
    console.log('Deleted:', deleteResult.deletedCount, 'admin user(s)');
    
    // Hash password
    console.log('🔐 Hashing password...');
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    console.log('✅ Password hashed');
    
    // Create admin user
    console.log('👤 Creating admin user...');
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
    
    const insertResult = await usersCollection.insertOne(adminUser);
    console.log('✅ Admin user created with ID:', insertResult.insertedId);
    
    // Verify the user was created
    console.log('🔍 Verifying user creation...');
    const createdUser = await usersCollection.findOne({ email: 'admin@bidcraft.com' });
    
    if (createdUser) {
      console.log('✅ User verified in database');
      console.log('📧 Email:', createdUser.email);
      console.log('🔑 Role:', createdUser.role);
      console.log('🟢 Active:', createdUser.isActive);
      console.log('✔️ Verified:', createdUser.isVerified);
      
      // Test password
      const passwordWorks = await bcrypt.compare('admin123', createdUser.password);
      console.log('🔐 Password test:', passwordWorks ? '✅ WORKS' : '❌ FAILED');
    } else {
      console.log('❌ User not found after creation');
    }
    
    console.log('');
    console.log('🎉 Setup complete! You can now login with:');
    console.log('📧 Email: admin@bidcraft.com');
    console.log('🔑 Password: admin123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('🔌 Connection closed');
  }
}

createAdminUser();
