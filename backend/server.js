const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const { startScheduledJobs } = require('./src/utils/scheduler');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      fontSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files for locally uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('📁 Static file serving enabled for uploads directory');

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.method === 'POST' && req.url.includes('/api/auctions')) {
    console.log('POST /api/auctions - Body keys:', Object.keys(req.body || {}));
  }
  next();
});

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running', timestamp: new Date().toISOString() });
});

// API Documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'BidCraft API',
    version: '1.0.0',
    description: 'Comprehensive auction platform backend API',
    baseUrl: `${req.protocol}://${req.get('host')}/api`,
    endpoints: {
      authentication: {
        'POST /auth/register': 'Register new user',
        'POST /auth/login': 'User login',
        'POST /auth/logout': 'User logout',
        'POST /auth/forgot-password': 'Request password reset',
        'POST /auth/reset-password': 'Reset password',
        'POST /auth/verify-email': 'Verify email address',
        'GET /auth/me': 'Get current user info'
      },
      users: {
        'GET /users/profile': 'Get user profile',
        'PUT /users/profile': 'Update user profile',
        'POST /users/avatar': 'Upload user avatar',
        'GET /users/watchlist': 'Get user watchlist',
        'POST /users/watchlist/:auctionId': 'Add to watchlist',
        'DELETE /users/watchlist/:auctionId': 'Remove from watchlist'
      },
      auctions: {
        'GET /auctions': 'Get all auctions (with filters)',
        'GET /auctions/:id': 'Get auction details',
        'POST /auctions': 'Create new auction',
        'PUT /auctions/:id': 'Update auction',
        'DELETE /auctions/:id': 'Delete auction',
        'POST /auctions/:id/watch': 'Watch auction',
        'POST /auctions/:id/buy-now': 'Buy now auction'
      },
      bidding: {
        'GET /bids/auction/:auctionId': 'Get auction bids',
        'POST /bids': 'Place bid',
        'GET /bids/user/my-bids': 'Get user bids',
        'POST /bids/auto-bid': 'Set auto-bidding',
        'DELETE /bids/:bidId': 'Retract bid'
      },
      items: {
        'GET /items/featured': 'Get featured items',
        'GET /items/trending': 'Get trending items',
        'GET /items/ending-soon': 'Get items ending soon',
        'GET /items/hot': 'Get hot items',
        'GET /items/recent': 'Get recent items',
        'GET /items/search': 'Search items',
        'GET /items/seller/:sellerId': 'Get items by seller',
        'GET /items/:itemId/recommendations': 'Get item recommendations'
      },
      orders: {
        'GET /orders': 'Get user orders',
        'POST /orders': 'Create order',
        'GET /orders/:orderId': 'Get order details',
        'PUT /orders/:orderId/status': 'Update order status',
        'POST /orders/:orderId/message': 'Add order message',
        'POST /orders/:orderId/confirm-delivery': 'Confirm delivery',
        'POST /orders/:orderId/dispute': 'Initiate dispute',
        'PUT /orders/:orderId/cancel': 'Cancel order'
      },
      payments: {
        'POST /payments/create-intent': 'Create payment intent',
        'POST /payments/confirm': 'Confirm payment',
        'POST /payments/paypal/create': 'Create PayPal payment',
        'POST /payments/paypal/execute': 'Execute PayPal payment',
        'GET /payments/my-payments': 'Get user payments',
        'GET /payments/:paymentId': 'Get payment details',
        'POST /payments/:paymentId/refund': 'Request refund'
      },
      reviews: {
        'GET /reviews/auction/:auctionId': 'Get auction reviews',
        'POST /reviews': 'Create review',
        'GET /reviews/seller/:sellerId': 'Get seller reviews',
        'PUT /reviews/:reviewId': 'Update review',
        'DELETE /reviews/:reviewId': 'Delete review'
      },
      categories: {
        'GET /categories': 'Get all categories',
        'GET /categories/:id': 'Get category details',
        'POST /categories': 'Create category (Admin)',
        'PUT /categories/:id': 'Update category (Admin)',
        'DELETE /categories/:id': 'Delete category (Admin)'
      },
      notifications: {
        'GET /notifications': 'Get user notifications',
        'PUT /notifications/read-all': 'Mark all as read',
        'PUT /notifications/:id/read': 'Mark notification as read',
        'DELETE /notifications/:id': 'Delete notification',
        'GET /notifications/preferences': 'Get notification preferences',
        'PUT /notifications/preferences': 'Update notification preferences'
      },
      analytics: {
        'GET /analytics/my-stats': 'Get user analytics',
        'GET /analytics/overview': 'Get platform overview (Admin)',
        'GET /analytics/user-activity': 'Get user activity (Admin)',
        'GET /analytics/seller-performance': 'Get seller performance (Admin)',
        'GET /analytics/auction-performance': 'Get auction performance (Admin)',
        'GET /analytics/financial': 'Get financial analytics (Admin)'
      },
      admin: {
        'GET /admin/dashboard': 'Get admin dashboard',
        'GET /admin/users': 'Get all users',
        'PUT /admin/users/:id/status': 'Update user status',
        'GET /admin/auctions': 'Get all auctions',
        'PUT /admin/auctions/:id/feature': 'Feature auction',
        'GET /admin/reports': 'Get platform reports',
        'GET /admin/activities': 'Get recent activities'
      },
      upload: {
        'POST /upload/image': 'Upload image',
        'POST /upload/multiple': 'Upload multiple images',
        'DELETE /upload/:filename': 'Delete uploaded file'
      }
    },
    features: [
      'JWT Authentication',
      'Real-time bidding with Socket.io',
      'Image upload with local storage',
      'Payment processing (Stripe/PayPal)',
      'Order management',
      'Review system',
      'Notification system',
      'Analytics dashboard',
      'Admin panel',
      'Rate limiting',
      'Input validation',
      'Error handling',
      'Email notifications',
      'File uploads',
      'Database optimization'
    ],
    socketEvents: {
      connection: 'User connects to auction system',
      'join-auction': 'Join specific auction room',
      'leave-auction': 'Leave auction room',
      'place-bid': 'Place bid on auction',
      'bid-placed': 'New bid notification',
      'auction-ended': 'Auction end notification',
      'outbid': 'User outbid notification',
      'buy-now': 'Buy now purchase',
      'notification': 'General notifications'
    }
  });
});

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/auctions', require('./src/routes/auctions'));
app.use('/api/bids', require('./src/routes/bids'));
app.use('/api/categories', require('./src/routes/categories'));
// New enhanced routes (all enabled)
app.use('/api/items', require('./src/routes/items'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/analytics', require('./src/routes/analytics'));
app.use('/api/upload', require('./src/routes/upload'));

// Critical routes that enable essential functionality

// Additional API routes - Testing systematically  
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/payments', require('./src/routes/paymentRoutes'));
// app.use('/api/reviews', require('./src/routes/reviewRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));

// Initialize enhanced Socket.io service
const SocketService = require('./src/services/socketService');
const socketService = new SocketService(io);

// Make socket service available globally for controllers
global.socketService = socketService;

// Log socket service initialization
console.log('🚀 Enhanced Socket.io service initialized with room-based auction updates');

// MongoDB connection - Local MongoDB setup
console.log('Connecting to local MongoDB...');

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bidcraft';
  
  console.log('MongoDB URI:', mongoURI);
  
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('🔌 Port:', mongoose.connection.port);
    
    // Start scheduled jobs after successful DB connection
    startScheduledJobs();
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if MongoDB service is running: net start MongoDB');
    console.log('2. Verify MongoDB is listening on 127.0.0.1:27017');
    console.log('3. Check Windows Services for "MongoDB" service');
    process.exit(1);
  }
};

connectDB();

// Error handling middleware (must be after routes)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, io };
