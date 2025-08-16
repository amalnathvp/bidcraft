const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 Testing MongoDB connection...');
console.log('📍 Connection URI:', process.env.MONGODB_URI ? 'Found in .env' : 'NOT FOUND in .env');

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env file');
  console.log('💡 Please check your .env file contains:');
  console.log('   MONGODB_URI=mongodb://localhost:27017/bidcraft');
  console.log('   OR');
  console.log('   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bidcraft');
  process.exit(1);
}

// Hide the password for security
const uriForDisplay = process.env.MONGODB_URI.replace(/:([^:@]{8})[^:@]*@/, ':****@');
console.log('🌐 Connecting to:', uriForDisplay);

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connected successfully!');
  console.log('🎉 Database name:', mongoose.connection.name);
  console.log('🖥️  Host:', mongoose.connection.host);
  console.log('🔌 Port:', mongoose.connection.port);
  
  // Test a simple operation
  return mongoose.connection.db.admin().ping();
})
.then(() => {
  console.log('🏓 Database ping successful!');
  console.log('');
  console.log('✨ Your MongoDB connection is working perfectly!');
  console.log('🚀 You can now start your BidCraft backend server with: npm start');
  process.exit(0);
})
.catch(err => {
  console.error('❌ MongoDB connection failed!');
  console.error('📋 Error details:', err.message);
  console.log('');
  console.log('🔧 Common solutions:');
  
  if (err.message.includes('ENOTFOUND') || err.message.includes('failed to connect')) {
    console.log('   1. Check if MongoDB is running (for local connections)');
    console.log('   2. Verify your connection string is correct');
    console.log('   3. Check your network connection');
  }
  
  if (err.message.includes('Authentication failed')) {
    console.log('   1. Check your username and password in the connection string');
    console.log('   2. Verify the database user exists in MongoDB Atlas');
  }
  
  if (err.message.includes('IP') || err.message.includes('network')) {
    console.log('   1. Add your IP address to MongoDB Atlas whitelist');
    console.log('   2. Check your firewall settings');
  }
  
  console.log('');
  console.log('📚 For detailed help, see: MONGODB_SETUP.md');
  process.exit(1);
});
