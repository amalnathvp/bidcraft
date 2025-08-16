const User = require('../models/User');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Get top sellers
// @route   GET /api/users/sellers
// @access  Public
const getTopSellers = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  
  const sellers = await User.find({ 
    role: 'seller', 
    isActive: true,
    totalSales: { $gt: 0 }
  })
    .select('name shopName sellerRating totalSales avatar')
    .sort({ sellerRating: -1, totalSales: -1 })
    .limit(limit);
  
  res.status(200).json({
    success: true,
    count: sellers.length,
    data: sellers
  });
});

// @desc    Get user profile
// @route   GET /api/users/:id/profile
// @access  Public
const getUserProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select('name shopName shopDescription sellerRating totalSales avatar createdAt');
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  // Get user's active auctions if seller
  let activeAuctions = [];
  if (user.role === 'seller') {
    activeAuctions = await Auction.find({ 
      seller: user._id, 
      status: 'active' 
    })
      .select('title images currentPrice endTime')
      .limit(6);
  }
  
  res.status(200).json({
    success: true,
    data: {
      user,
      activeAuctions
    }
  });
});

// @desc    Get user dashboard data
// @route   GET /api/users/me/dashboard
// @access  Private
const getDashboard = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const userRole = req.user.role;
  
  let dashboardData = {
    user: req.user
  };
  
  if (userRole === 'seller') {
    // Seller dashboard data
    const [totalAuctions, activeAuctions, totalSales, recentBids] = await Promise.all([
      Auction.countDocuments({ seller: userId }),
      Auction.countDocuments({ seller: userId, status: 'active' }),
      Auction.aggregate([
        { $match: { seller: userId, status: 'sold' } },
        { $group: { _id: null, total: { $sum: '$currentPrice' } } }
      ]),
      Bid.find({ auction: { $in: await Auction.find({ seller: userId }).distinct('_id') } })
        .populate('auction', 'title')
        .populate('bidder', 'name')
        .sort({ bidTime: -1 })
        .limit(10)
    ]);
    
    dashboardData.sellerStats = {
      totalAuctions,
      activeAuctions,
      totalSales: totalSales[0]?.total || 0,
      recentBids
    };
  } else {
    // Buyer dashboard data
    const [totalBids, winningBids, watchlistCount, recentBids] = await Promise.all([
      Bid.countDocuments({ bidder: userId }),
      Bid.countDocuments({ bidder: userId, isWinning: true }),
      req.user.watchlist.length,
      Bid.find({ bidder: userId })
        .populate('auction', 'title images endTime status')
        .sort({ bidTime: -1 })
        .limit(10)
    ]);
    
    dashboardData.buyerStats = {
      totalBids,
      winningBids,
      watchlistCount,
      recentBids
    };
  }
  
  res.status(200).json({
    success: true,
    data: dashboardData
  });
});

// @desc    Get user notifications
// @route   GET /api/users/me/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res, next) => {
  // This would typically fetch from a notifications collection
  // For now, return user's notification settings
  res.status(200).json({
    success: true,
    data: {
      settings: req.user.notifications,
      notifications: [] // Placeholder for actual notifications
    }
  });
});

// @desc    Update notification settings
// @route   PATCH /api/users/me/notifications
// @access  Private
const updateNotificationSettings = asyncHandler(async (req, res, next) => {
  const { email, push } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { 
      $set: {
        'notifications.email': email,
        'notifications.push': push
      }
    },
    { new: true }
  ).select('notifications');
  
  res.status(200).json({
    success: true,
    message: 'Notification settings updated successfully',
    data: user.notifications
  });
});

// @desc    Get user's watchlist
// @route   GET /api/users/me/watchlist
// @access  Private
const getWatchlist = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .populate({
      path: 'watchlist',
      populate: {
        path: 'category seller',
        select: 'name shopName'
      }
    });
  
  res.status(200).json({
    success: true,
    count: user.watchlist.length,
    data: user.watchlist
  });
});

// @desc    Get user's purchase history
// @route   GET /api/users/me/purchase-history
// @access  Private
const getPurchaseHistory = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;
  
  const wonAuctions = await Auction.find({ winner: req.user._id })
    .populate('category', 'name')
    .populate('seller', 'name shopName')
    .sort({ updatedAt: -1 })
    .limit(limit)
    .skip(startIndex);
  
  const total = await Auction.countDocuments({ winner: req.user._id });
  
  res.status(200).json({
    success: true,
    count: wonAuctions.length,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      total
    },
    data: wonAuctions
  });
});

// @desc    Get seller's selling history
// @route   GET /api/users/me/selling-history
// @access  Private (Seller only)
const getSellingHistory = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;
  
  const soldAuctions = await Auction.find({ 
    seller: req.user._id,
    status: { $in: ['sold', 'ended'] }
  })
    .populate('category', 'name')
    .populate('winner', 'name')
    .sort({ updatedAt: -1 })
    .limit(limit)
    .skip(startIndex);
  
  const total = await Auction.countDocuments({ 
    seller: req.user._id,
    status: { $in: ['sold', 'ended'] }
  });
  
  res.status(200).json({
    success: true,
    count: soldAuctions.length,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      total
    },
    data: soldAuctions
  });
});

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin only)
const getAllUsers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const startIndex = (page - 1) * limit;
  
  let query = {};
  
  // Filtering
  if (req.query.role) {
    query.role = req.query.role;
  }
  
  if (req.query.isActive !== undefined) {
    query.isActive = req.query.isActive === 'true';
  }
  
  if (req.query.isVerified !== undefined) {
    query.isVerified = req.query.isVerified === 'true';
  }
  
  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(startIndex);
  
  const total = await User.countDocuments(query);
  
  res.status(200).json({
    success: true,
    count: users.length,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      total
    },
    data: users
  });
});

// @desc    Update user status (Admin only)
// @route   PATCH /api/users/:id/status
// @access  Private (Admin only)
const updateUserStatus = asyncHandler(async (req, res, next) => {
  const { isActive, isVerified } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive, isVerified },
    { new: true }
  ).select('-password');
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  res.status(200).json({
    success: true,
    message: 'User status updated successfully',
    data: user
  });
});

// @desc    Get user analytics (Admin only)
// @route   GET /api/users/analytics
// @access  Private (Admin only)
const getUserAnalytics = asyncHandler(async (req, res, next) => {
  const [
    totalUsers,
    activeUsers,
    verifiedUsers,
    sellersCount,
    buyersCount,
    recentSignups
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isVerified: true }),
    User.countDocuments({ role: 'seller' }),
    User.countDocuments({ role: 'buyer' }),
    User.countDocuments({ 
      createdAt: { 
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
      } 
    })
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      verifiedUsers,
      sellersCount,
      buyersCount,
      recentSignups,
      userGrowth: {
        // Could add more detailed analytics here
        last30Days: recentSignups
      }
    }
  });
});

module.exports = {
  getTopSellers,
  getUserProfile,
  getDashboard,
  getNotifications,
  updateNotificationSettings,
  getWatchlist,
  getPurchaseHistory,
  getSellingHistory,
  getAllUsers,
  updateUserStatus,
  getUserAnalytics
};
