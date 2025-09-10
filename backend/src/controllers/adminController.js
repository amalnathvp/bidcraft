const User = require('../models/User');
const Auction = require('../models/Auction');
const Order = require('../models/Order');

// Get admin dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Get total users count
    const totalUsers = await User.countDocuments();
    
    // Get active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: thirtyDaysAgo }
    });

    // Get currently online users (last 5 minutes) - using lastLogin as proxy
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const onlineUsers = await User.countDocuments({
      lastLogin: { $gte: fiveMinutesAgo }
    });

    // Get total auctions
    const totalAuctions = await Auction.countDocuments();

    // Get total completed orders for revenue calculation
    const completedOrders = await Order.find({
      status: { $in: ['delivered', 'completed'] }
    });

    // Calculate total revenue (sum of all completed order amounts)
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Calculate commission earned (assuming 5% platform fee)
    const commissionRate = 0.05;
    const totalCommission = totalRevenue * commissionRate;

    // Get pending approvals (draft or scheduled auctions)
    const pendingApprovals = await Auction.countDocuments({
      status: { $in: ['draft', 'scheduled'] }
    });

    // Get open disputes
    const disputesOpen = await Order.countDocuments({
      'dispute.isDisputed': true,
      'dispute.status': { $in: ['open', 'investigating'] }
    });

    // Get fraud alerts (reported auctions)
    const fraudAlerts = await Auction.countDocuments({
      'reported.count': { $gt: 0 }
    });

    // Recent activity stats
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: last24Hours }
    });

    const newAuctionsToday = await Auction.countDocuments({
      createdAt: { $gte: last24Hours }
    });

    const ordersToday = await Order.countDocuments({
      createdAt: { $gte: last24Hours }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalAuctions,
        totalRevenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimal places
        totalCommission: Math.round(totalCommission * 100) / 100,
        activeUsers: onlineUsers, // Use online users for "Active Now"
        pendingApprovals,
        disputesOpen,
        fraudAlerts,
        recentActivity: {
          newUsersToday,
          newAuctionsToday,
          ordersToday
        }
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

// Get detailed user analytics
const getUserAnalytics = async (req, res) => {
  try {
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const usersByMonth = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      data: {
        usersByRole,
        usersByMonth
      }
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user analytics',
      error: error.message
    });
  }
};

// Get revenue analytics
const getRevenueAnalytics = async (req, res) => {
  try {
    const revenueByMonth = await Order.aggregate([
      {
        $match: {
          status: { $in: ['delivered', 'completed'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalRevenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    const topSellingCategories = await Order.aggregate([
      {
        $match: {
          status: { $in: ['delivered', 'completed'] }
        }
      },
      {
        $lookup: {
          from: 'auctions',
          localField: 'auction',
          foreignField: '_id',
          as: 'auctionData'
        }
      },
      { $unwind: '$auctionData' },
      {
        $lookup: {
          from: 'categories',
          localField: 'auctionData.category',
          foreignField: '_id',
          as: 'categoryData'
        }
      },
      { $unwind: '$categoryData' },
      {
        $group: {
          _id: '$categoryData.name',
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        revenueByMonth,
        topSellingCategories
      }
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue analytics',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getUserAnalytics,
  getRevenueAnalytics
};