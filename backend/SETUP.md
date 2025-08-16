# BidCraft Backend - Development Setup

## Quick Start Guide

### Prerequisites
1. **Node.js** (v14 or higher)
2. **MongoDB** (local installation or MongoDB Atlas)
3. **Git**

### Installation Steps

1. **Navigate to backend directory:**
   ```bash
   cd bidcraft/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your settings (see below)
   ```

4. **Environment Configuration (.env):**
   ```env
   # Basic Configuration
   NODE_ENV=development
   PORT=5000
   
   # Database (MongoDB)
   # Option 1: Local MongoDB
   MONGODB_URI=mongodb://localhost:27017/bidcraft
   
   # Option 2: MongoDB Atlas (recommended)
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bidcraft
   
   # JWT Secret (generate a secure random string)
   JWT_SECRET=your_super_secret_jwt_key_make_it_very_long_and_random_123456789
   
   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   
   # Email Configuration (for development, can use Gmail)
   EMAIL_FROM=noreply@bidcraft.com
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # Cloudinary (for image uploads - optional for basic testing)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Security Settings
   BCRYPT_ROUNDS=12
   MAX_FILE_SIZE=5242880
   ```

### Database Setup

#### Option 1: Local MongoDB
1. **Install MongoDB Community Edition**
2. **Start MongoDB service:**
   ```bash
   # Windows (if installed as service)
   net start MongoDB
   
   # macOS (with Homebrew)
   brew services start mongodb-community
   
   # Linux (with systemd)
   sudo systemctl start mongod
   ```

#### Option 2: MongoDB Atlas (Cloud)
1. **Create account** at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. **Create a cluster** (free tier available)
3. **Get connection string** and update MONGODB_URI in .env
4. **Whitelist your IP** in Atlas security settings

### Seed Database (Important!)

After setting up MongoDB, populate the database with initial data:

```bash
npm run seed
```

This creates:
- **Categories**: Pottery, Textiles, Woodworking, etc.
- **Test Users**: Admin, sellers, and buyers
- **Sample Data**: For development and testing

### Start the Server

```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

### Verify Setup

1. **Server should start** and show:
   ```
   Server is running on port 5000
   Environment: development
   MongoDB connected successfully
   Scheduled jobs started
   ```

2. **Test API endpoints:**
   ```bash
   # Health check
   curl http://localhost:5000/api/categories
   
   # Should return list of categories
   ```

### Test Accounts

After seeding, use these accounts for testing:

**Admin:**
- Email: `admin@bidcraft.com`
- Password: `admin123`

**Sellers:**
- `maria@pottery.com` / `seller123` (Maria's Pottery Studio)
- `david@woodcraft.com` / `seller123` (Chen Woodworking)
- `sarah@textiles.com` / `seller123` (Woven Dreams)

**Buyers:**
- `john@example.com` / `buyer123`
- `emma@example.com` / `buyer123`

### API Testing

#### Using curl:
```bash
# Register new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123","role":"buyer"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bidcraft.com","password":"admin123"}'

# Get auctions
curl http://localhost:5000/api/auctions
```

#### Using Postman:
1. **Import collection** (if available)
2. **Set base URL** to `http://localhost:5000`
3. **Test authentication** endpoints first
4. **Use Bearer token** for protected routes

### Troubleshooting

#### MongoDB Connection Issues:
```bash
# Check if MongoDB is running
# Windows
tasklist | findstr mongod

# macOS/Linux
ps aux | grep mongod
```

#### Port Already in Use:
```bash
# Find process using port 5000
# Windows
netstat -ano | findstr :5000

# macOS/Linux
lsof -i :5000

# Kill the process if needed
```

#### Email Issues:
- For Gmail, use **App Passwords** instead of regular password
- Enable **2-factor authentication** on Gmail account
- Generate **App Password** in Google Account settings

#### Environment Variables:
- Ensure `.env` file is in the backend root directory
- Check that all required variables are set
- Restart server after changing .env file

### Development Workflow

1. **Make changes** to code
2. **Server auto-restarts** (if using `npm run dev`)
3. **Test endpoints** with Postman or curl
4. **Check logs** in terminal for errors
5. **Database changes** may require re-seeding

### Production Deployment

1. **Set NODE_ENV=production**
2. **Use strong JWT_SECRET**
3. **Configure production database**
4. **Set up proper email service**
5. **Configure Cloudinary for images**
6. **Set FRONTEND_URL** to production domain

### Need Help?

1. **Check server logs** for error messages
2. **Verify environment variables** are correct
3. **Ensure MongoDB is running** and accessible
4. **Test with seeded data** first
5. **Check API documentation** in README.md
