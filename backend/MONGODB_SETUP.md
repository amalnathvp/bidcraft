# MongoDB Connection Troubleshooting Guide

## ❌ Common Error Messages

### "MongooseError: Operation `users.findOne()` buffering timed out"
- **Cause**: Cannot connect to MongoDB
- **Solution**: Check MongoDB service or connection string

### "MongoNetworkError: failed to connect to server"
- **Cause**: MongoDB server not running or wrong connection string
- **Solution**: Start MongoDB service or fix connection string

### "MongoServerError: bad auth"
- **Cause**: Wrong username/password in connection string
- **Solution**: Check database user credentials

## 🔧 Solution Options

### Option 1: MongoDB Atlas (Cloud) - RECOMMENDED FOR BEGINNERS

#### Step-by-Step Setup:

1. **Create Account**
   ```
   1. Go to https://www.mongodb.com/atlas
   2. Sign up for free account
   3. Verify email address
   ```

2. **Create Cluster**
   ```
   1. Click "Build a Database"
   2. Choose "FREE" tier (M0 Sandbox)
   3. Select cloud provider and region (any)
   4. Cluster name: "BidCraft" (or any name)
   5. Click "Create Cluster"
   ```

3. **Configure Database Access**
   ```
   1. Go to "Database Access" in left sidebar
   2. Click "Add New Database User"
   3. Username: bidcraft_user
   4. Password: Generate secure password (SAVE THIS!)
   5. Database User Privileges: "Read and write to any database"
   6. Click "Add User"
   ```

4. **Configure Network Access**
   ```
   1. Go to "Network Access" in left sidebar
   2. Click "Add IP Address"
   3. Choose "Allow access from anywhere" (0.0.0.0/0)
   4. Or add your current IP address
   5. Click "Confirm"
   ```

5. **Get Connection String**
   ```
   1. Go to "Database" in left sidebar
   2. Click "Connect" on your cluster
   3. Choose "Connect your application"
   4. Select "Node.js" and version "4.1 or later"
   5. Copy the connection string
   ```

6. **Update .env File**
   ```env
   # Replace in your .env file:
   MONGODB_URI=mongodb+srv://bidcraft_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/bidcraft?retryWrites=true&w=majority
   ```
   
   **Important**: Replace `YOUR_PASSWORD` with the actual password you created!

### Option 2: Local MongoDB Installation

#### For Windows:

1. **Download MongoDB**
   ```
   1. Go to https://www.mongodb.com/try/download/community
   2. Select: Windows, Version 7.0+, Package: msi
   3. Download and install
   ```

2. **Install as Windows Service**
   ```
   During installation:
   ✅ Install MongoDB as a Service
   ✅ Run service as Network Service user
   ✅ Service Name: MongoDB
   ```

3. **Start MongoDB Service**
   ```powershell
   # Open PowerShell as Administrator
   net start MongoDB
   
   # Check if running
   Get-Service MongoDB
   ```

4. **Create Data Directory**
   ```powershell
   # Create data directory if not exists
   New-Item -ItemType Directory -Force -Path "C:\data\db"
   ```

5. **Verify Installation**
   ```powershell
   # Test connection
   "C:\Program Files\MongoDB\Server\7.0\bin\mongo.exe" --eval "db.adminCommand('ismaster')"
   ```

#### For macOS:

1. **Install with Homebrew**
   ```bash
   # Install Homebrew if not installed
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   
   # Install MongoDB
   brew tap mongodb/brew
   brew install mongodb-community
   
   # Start MongoDB
   brew services start mongodb-community
   ```

#### For Linux (Ubuntu/Debian):

1. **Install MongoDB**
   ```bash
   # Import public key
   wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
   
   # Add MongoDB repository
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
   
   # Update and install
   sudo apt-get update
   sudo apt-get install -y mongodb-org
   
   # Start MongoDB
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

## 🧪 Testing Connection

### Test with Node.js:
```javascript
// test-connection.js
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
```

Run test:
```bash
cd backend
node test-connection.js
```

### Test with MongoDB Compass (GUI):
1. Download MongoDB Compass: https://www.mongodb.com/products/compass
2. Use your connection string to connect
3. Verify you can see databases

## 🔍 Common Issues & Solutions

### Issue: "Authentication failed"
**Solution**: Check username and password in connection string

### Issue: "Server selection timed out"
**Solutions**:
- Check network connectivity
- Verify IP whitelist in Atlas
- Check firewall settings

### Issue: "Cannot connect to localhost:27017"
**Solutions**:
- Install MongoDB locally
- Start MongoDB service
- Use MongoDB Atlas instead

### Issue: "Database name contains invalid characters"
**Solution**: Ensure database name in connection string is valid (no spaces, special chars)

## 📝 Environment File Examples

### For MongoDB Atlas:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/bidcraft?retryWrites=true&w=majority
JWT_SECRET=your_very_long_random_secret_key_here
FRONTEND_URL=http://localhost:3000
```

### For Local MongoDB:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bidcraft
JWT_SECRET=your_very_long_random_secret_key_here
FRONTEND_URL=http://localhost:3000
```

## 🚀 Quick Start Commands

1. **Setup with Atlas** (Recommended):
   ```bash
   # Update .env with Atlas connection string
   # Then start the server
   cd backend
   npm start
   ```

2. **Setup with Local MongoDB**:
   ```bash
   # Start MongoDB service first
   net start MongoDB  # Windows
   brew services start mongodb-community  # macOS
   sudo systemctl start mongod  # Linux
   
   # Then start the server
   cd backend
   npm start
   ```

3. **Seed the database**:
   ```bash
   cd backend
   npm run seed
   ```

## 💡 Pro Tips

1. **Use MongoDB Atlas for development** - It's free and requires no local setup
2. **Keep your connection string secure** - Never commit it to Git
3. **Use environment variables** - Different connection strings for dev/prod
4. **Test connection first** - Before running the full application
5. **Monitor your usage** - Atlas free tier has limits

## 🆘 Still Having Issues?

1. **Check the exact error message** in your terminal
2. **Verify your .env file** has the correct connection string
3. **Test connection independently** using the test script above
4. **Check MongoDB Atlas dashboard** for connection logs
5. **Ensure your IP is whitelisted** in Atlas Network Access

## 📞 Getting Help

If you're still having issues:
1. Copy the exact error message
2. Share your connection string (without password)
3. Mention which option you're trying (Atlas vs Local)
4. Include your operating system
