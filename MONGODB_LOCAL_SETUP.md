# MongoDB Local Setup Guide for BidCraft

## 🚀 Quick Setup Instructions

### Option 1: Download and Install MongoDB Community Edition

1. **Download MongoDB Community Edition**
   - Go to: https://www.mongodb.com/try/download/community
   - Select: Windows x64
   - Version: Latest (7.x)
   - Package: MSI
   - Click "Download"

2. **Install MongoDB**
   - Run the downloaded .msi file
   - Choose "Complete" installation
   - Install MongoDB as a Service: ✅ Checked
   - Service Name: MongoDB
   - Data Directory: C:\Program Files\MongoDB\Server\7.0\data\
   - Log Directory: C:\Program Files\MongoDB\Server\7.0\log\

3. **Install MongoDB Compass (Optional but Recommended)**
   - Check "Install MongoDB Compass" during installation
   - This provides a GUI for database management

### Option 2: Use MongoDB Docker Container (Alternative)

If you have Docker installed:
```bash
docker run -d -p 27017:27017 --name mongodb-bidcraft -v mongodb_data:/data/db mongo:7.0
```

## 🔧 Configuration

### Step 1: Update Environment Variables

The `.env` file is already configured for local MongoDB:
```env
MONGODB_URI=mongodb://localhost:27017/bidcraft
```

### Step 2: Start MongoDB Service

After installation, MongoDB should start automatically as a Windows service.
You can verify by running:
```cmd
net start MongoDB
```

### Step 3: Test Connection

Run this command to test MongoDB connection:
```cmd
mongo mongodb://localhost:27017/bidcraft --eval "db.stats()"
```

## 🗃️ Database Initialization

### Step 1: Seed the Database

Once MongoDB is running, initialize with sample data:
```bash
cd backend
npm run seed
```

### Step 2: Verify Data

Connect to your local MongoDB and verify the data:
```bash
mongo mongodb://localhost:27017/bidcraft
db.users.find().pretty()
db.auctions.find().pretty()
```

## 📊 MongoDB Management

### Using MongoDB Compass (GUI)
- Open MongoDB Compass
- Connect to: `mongodb://localhost:27017`
- Database: `bidcraft`
- Browse collections: users, auctions, bids, categories

### Using MongoDB Shell
```bash
# Connect to database
mongo mongodb://localhost:27017/bidcraft

# Show collections
show collections

# Query examples
db.users.find()
db.auctions.find({status: 'active'})
db.bids.find().sort({createdAt: -1}).limit(10)
```

## 🔍 Troubleshooting

### If MongoDB doesn't start:
1. Check Windows Services (services.msc)
2. Look for "MongoDB" service
3. Start it manually if stopped

### If connection fails:
1. Verify MongoDB is running: `netstat -ano | findstr :27017`
2. Check firewall settings
3. Ensure MongoDB service is started

### Data Directory Issues:
- Default data directory: `C:\data\db`
- Create manually if it doesn't exist:
  ```cmd
  mkdir C:\data\db
  ```

## 📁 Project Integration

The BidCraft project is already configured to use local MongoDB:

1. **Fallback Configuration**: Server tries Atlas first, then falls back to local
2. **Connection String**: `mongodb://localhost:27017/bidcraft`
3. **Database Models**: All models are ready for local MongoDB
4. **Seeder Script**: Available to populate initial data

## ✅ Next Steps

1. Install MongoDB Community Edition
2. Verify service is running
3. Restart the BidCraft backend server
4. Check logs for successful connection
5. Run the seeder script to populate data
6. Test authentication and features

The application will automatically detect the local MongoDB and connect to it!
