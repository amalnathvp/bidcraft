const User = require('../models/User');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Get platform analytics overview
// @route   GET /api/analytics/overview
// @access  Private (Admin only)
const getOverviewAnalytics = asyncHandler(async (req, res, next) => {
  const { period = '30d', startDate, endDate } = req.query;
  
  let dateFilter = {};
  
  if (startDate && endDate) {
    dateFilter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
  } else {
    const now = new Date();
    let daysBack;
    
    switch (period) {
      case '7d':
        daysBack = 7;
        break;
      case '30d':
        daysBack = 30;
        break;
      case '90d':
        daysBack = 90;
        break;
      case '1y':
        daysBack = 365;
        break;
      default:
        daysBack = 30;
    }
    
    dateFilter = {
      createdAt: {
        $gte: new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)
      }
    };
  }
  
  // User metrics
  const userMetrics = await User.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        buyers: { $sum: { $cond: [{ $eq: ['$role', 'buyer'] }, 1, 0] } },
        sellers: { $sum: { $cond: [{ $eq: ['$role', 'seller'] }, 1, 0] } },
        verifiedUsers: { $sum: { $cond: ['$isVerified', 1, 0] } }
      }
    }
  ]);
  
  // Auction metrics
  const auctionMetrics = await Auction.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: null,
        totalAuctions: { $sum: 1 },
        activeAuctions: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        endedAuctions: { $sum: { $cond: [{ $eq: ['$status', 'ended'] }, 1, 0] } },
        totalBids: { $sum: '$bidCount' },
        averageStartingPrice: { $avg: '$startingPrice' },
        averageFinalPrice: { $avg: '$currentPrice' }
      }
    }
  ]);
  
  // Revenue metrics
  const revenueMetrics = await Payment.aggregate([
    { $match: { ...dateFilter, status: 'completed' } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        platformFees: { $sum: '$platformFee' },
        averageTransaction: { $avg: '$amount' },
        totalTransactions: { $sum: 1 }
      }
    }
  ]);
  
  // Top categories
  const topCategories = await Auction.aggregate([
    { $match: dateFilter },
    { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'categoryInfo' } },
    { $unwind: '$categoryInfo' },
    {
      $group: {
        _id: '$categoryInfo.name',
        count: { $sum: 1 },
        totalValue: { $sum: '$currentPrice' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      period,
      users: userMetrics[0] || {},
      auctions: auctionMetrics[0] || {},
      revenue: revenueMetrics[0] || {},
      topCategories
    }
  });
});

// @desc    Get user activity analytics
// @route   GET /api/analytics/user-activity
// @access  Private (Admin only)
const getUserActivityAnalytics = asyncHandler(async (req, res, next) => {
  const { period = '30d' } = req.query;
  
  const now = new Date();
  const daysBack = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  
  // Daily user registrations
  const dailyRegistrations = await User.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
  
  // Active users by day
  const dailyActiveUsers = await User.aggregate([
    { $match: { lastLogin: { $gte: startDate } } },
    {
      $group: {
        _id: {
          year: { $year: '$lastLogin' },
          month: { $month: '$lastLogin' },
          day: { $dayOfMonth: '$lastLogin' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      dailyRegistrations,
      dailyActiveUsers
    }
  });
});

// @desc    Get seller performance analytics
// @route   GET /api/analytics/seller-performance
// @access  Private (Admin only)
const getSellerPerformanceAnalytics = asyncHandler(async (req, res, next) => {
  const topSellers = await User.aggregate([
    { $match: { role: 'seller' } },
    {
      $lookup: {
        from: 'auctions',
        localField: '_id',
        foreignField: 'seller',
        as: 'auctions'
      }
    },
    {
      $addFields: {
        totalAuctions: { $size: '$auctions' },
        totalRevenue: { $sum: '$auctions.currentPrice' },
        activeAuctions: {
          $size: {
            $filter: {
              input: '$auctions',
              cond: { $eq: ['$$this.status', 'active'] }
            }
          }
        }
      }
    },
    {
      $project: {
        name: 1,
        shopName: 1,
        email: 1,
        sellerRating: 1,
        totalAuctions: 1,
        activeAuctions: 1,
        totalRevenue: 1,
        averageAuctionValue: { $divide: ['$totalRevenue', '$totalAuctions'] }
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: 20 }
  ]);
  
  res.status(200).json({
    success: true,
    data: topSellers
  });
});

// @desc    Get auction performance analytics
// @route   GET /api/analytics/auction-performance
// @access  Private (Admin only)
const getAuctionPerformanceAnalytics = asyncHandler(async (req, res, next) => {
  const { period = '30d' } = req.query;
  
  const now = new Date();
  const daysBack = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  
  // Auction completion rates
  const completionRates = await Auction.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: null,
        totalAuctions: { $sum: 1 },
        endedAuctions: { $sum: { $cond: [{ $eq: ['$status', 'ended'] }, 1, 0] } },
        activeAuctions: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        cancelledAuctions: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
      }
    }
  ]);
  
  // Average bid counts and prices
  const biddingStats = await Auction.aggregate([
    { $match: { createdAt: { $gte: startDate }, status: 'ended' } },
    {
      $group: {
        _id: null,
        averageBidCount: { $avg: '$bidCount' },
        averageStartingPrice: { $avg: '$startingPrice' },
        averageFinalPrice: { $avg: '$currentPrice' },
        totalValueTransacted: { $sum: '$currentPrice' }
      }
    }
  ]);
  
  // Most competitive auctions (highest bid counts)
  const competitiveAuctions = await Auction.find({
    createdAt: { $gte: startDate }
  })
    .populate('seller', 'name shopName')
    .populate('category', 'name')
    .sort({ bidCount: -1 })
    .limit(10)
    .select('title bidCount currentPrice startingPrice endTime status');
  
  res.status(200).json({
    success: true,
    data: {
      completionRates: completionRates[0] || {},
      biddingStats: biddingStats[0] || {},
      competitiveAuctions
    }
  });
});

// @desc    Get financial analytics
// @route   GET /api/analytics/financial
// @access  Private (Admin only)
const getFinancialAnalytics = asyncHandler(async (req, res, next) => {
  const { period = '30d' } = req.query;
  
  const now = new Date();
  const daysBack = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  
  // Daily revenue
  const dailyRevenue = await Payment.aggregate([
    { $match: { createdAt: { $gte: startDate }, status: 'completed' } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        revenue: { $sum: '$amount' },
        platformFees: { $sum: '$platformFee' },
        transactionCount: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
  
  // Payment method breakdown
  const paymentMethods = await Payment.aggregate([
    { $match: { createdAt: { $gte: startDate }, status: 'completed' } },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  // Refund analytics
  const refundStats = await Payment.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        refundedPayments: { $sum: { $cond: [{ $eq: ['$refundStatus', 'completed'] }, 1, 0] } },
        pendingRefunds: { $sum: { $cond: [{ $eq: ['$refundStatus', 'pending'] }, 1, 0] } },
        totalRefundAmount: { $sum: { $cond: [{ $eq: ['$refundStatus', 'completed'] }, '$refundAmount', 0] } }
      }
    }
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      dailyRevenue,
      paymentMethods,
      refundStats: refundStats[0] || {}
    }
  });
});

// @desc    Get user analytics for individual users
// @route   GET /api/analytics/my-stats
// @access  Private
const getMyAnalytics = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  
  // User's auction statistics
  const auctionStats = await Auction.aggregate([
    { $match: { seller: userId } },
    {
      $group: {
        _id: null,
        totalAuctions: { $sum: 1 },
        activeAuctions: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        endedAuctions: { $sum: { $cond: [{ $eq: ['$status', 'ended'] }, 1, 0] } },
        totalRevenue: { $sum: '$currentPrice' },
        totalBids: { $sum: '$bidCount' }
      }
    }
  ]);
  
  // User's bidding statistics
  const biddingStats = await Bid.aggregate([
    { $match: { bidder: userId } },
    {
      $group: {
        _id: null,
        totalBids: { $sum: 1 },
        totalAmountBid: { $sum: '$amount' },
        wonAuctions: { $sum: { $cond: ['$isWinning', 1, 0] } }
      }
    }
  ]);
  
  // Recent activity
  const recentAuctions = await Auction.find({ seller: userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title currentPrice bidCount status endTime');
  
  const recentBids = await Bid.find({ bidder: userId })
    .populate('auction', 'title endTime')
    .sort({ bidTime: -1 })
    .limit(5)
    .select('amount bidTime isWinning');
  
  res.status(200).json({
    success: true,
    data: {
      auctionStats: auctionStats[0] || {},
      biddingStats: biddingStats[0] || {},
      recentAuctions,
      recentBids
    }
  });
});

module.exports = {
  getOverviewAnalytics,
  getUserActivityAnalytics,
  getSellerPerformanceAnalytics,
  getAuctionPerformanceAnalytics,
  getFinancialAnalytics,
  getMyAnalytics
};
