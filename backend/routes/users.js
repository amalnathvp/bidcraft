const express = require('express');
const { query } = require('express-validator');
const User = require('../models/User');
const Product = require('../models/Product');
const Bid = require('../models/Bid');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get user dashboard data
// @route   GET /api/users/dashboard
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let dashboardData = {
      user: req.user,
      stats: {}
    };

    if (userRole === 'seller' || userRole === 'admin') {
      // Seller/Admin dashboard
      const [
        activeListings,
        totalListings,
        totalSales,
        totalRevenue,
        recentBids
      ] = await Promise.all([
        Product.countDocuments({ 
          seller: userId, 
          status: { $in: ['active', 'scheduled'] },
          isActive: true 
        }),
        Product.countDocuments({ 
          seller: userId,
          isActive: true 
        }),
        Product.countDocuments({ 
          seller: userId, 
          status: 'sold',
          isActive: true 
        }),
        Product.aggregate([
          { 
            $match: { 
              seller: userId, 
              status: 'sold',
              isActive: true 
            } 
          },
          { 
            $group: { 
              _id: null, 
              total: { $sum: '$finalPrice' } 
            } 
          }
        ]),
        Bid.find({
          product: { 
            $in: await Product.find({ seller: userId }).distinct('_id') 
          }
        })
        .populate('bidder', 'firstName lastName avatar')
        .populate('product', 'title images')
        .sort({ createdAt: -1 })
        .limit(10)
      ]);

      dashboardData.stats = {
        activeListings,
        totalListings,
        totalSales,
        totalRevenue: totalRevenue[0]?.total || 0,
        recentBids
      };

      // Get recent products
      dashboardData.recentProducts = await Product.find({
        seller: userId,
        isActive: true
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    } else {
      // Buyer dashboard
      const [
        activeBids,
        totalBids,
        wonAuctions,
        watchedItems,
        recentBids
      ] = await Promise.all([
        Bid.countDocuments({ 
          bidder: userId, 
          isActive: true,
          isWinning: true
        }),
        Bid.countDocuments({ 
          bidder: userId, 
          isActive: true 
        }),
        User.findById(userId).select('wonAuctions'),
        Product.countDocuments({ 
          watchers: userId,
          status: { $in: ['active', 'scheduled'] },
          isActive: true 
        }),
        Bid.find({ bidder: userId, isActive: true })
        .populate('product', 'title images currentBid status auctionEndDate')
        .sort({ createdAt: -1 })
        .limit(10)
      ]);

      dashboardData.stats = {
        activeBids,
        totalBids,
        wonAuctions: wonAuctions.wonAuctions,
        watchedItems,
        recentBids
      };

      // Get watched items
      dashboardData.watchedItems = await Product.find({
        watchers: userId,
        status: { $in: ['active', 'scheduled'] },
        isActive: true
      })
      .populate('seller', 'firstName lastName shopName')
      .sort({ auctionEndDate: 1 })
      .limit(5)
      .lean();
    }

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data'
    });
  }
});

// @desc    Get user's products (for sellers)
// @route   GET /api/users/my-products
// @access  Private (Seller/Admin)
router.get('/my-products', protect, authorize('seller', 'admin'), [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['draft', 'scheduled', 'active', 'ended', 'sold', 'cancelled'])
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const filter = {
      seller: req.user._id,
      isActive: true
    };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const products = await Product.find(filter)
      .populate('highestBidder', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Product.countDocuments(filter);

    // Add bid count for each product
    for (let product of products) {
      const bidCount = await Bid.countDocuments({
        product: product._id,
        isActive: true
      });
      product.bidCount = bidCount;
    }

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get my products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products'
    });
  }
});

// @desc    Get user's watchlist
// @route   GET /api/users/watchlist
// @access  Private
router.get('/watchlist', protect, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const products = await Product.find({
      watchers: req.user._id,
      isActive: true
    })
    .populate('seller', 'firstName lastName shopName avatar')
    .populate('highestBidder', 'firstName lastName')
    .sort({ auctionEndDate: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

    const total = await Product.countDocuments({
      watchers: req.user._id,
      isActive: true
    });

    // Add user bid status for each product
    for (let product of products) {
      product.userHasBid = await Bid.exists({
        product: product._id,
        bidder: req.user._id,
        isActive: true
      });
    }

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching watchlist'
    });
  }
});

// @desc    Get user's order history
// @route   GET /api/users/orders
// @access  Private
router.get('/orders', protect, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('type').optional().isIn(['won', 'sold'])
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const type = req.query.type || 'won';

    let filter;
    let populateFields;

    if (type === 'won') {
      // Items user won
      filter = {
        soldTo: req.user._id,
        status: 'sold',
        isActive: true
      };
      populateFields = 'seller';
    } else {
      // Items user sold
      filter = {
        seller: req.user._id,
        status: 'sold',
        isActive: true
      };
      populateFields = 'soldTo';
    }

    const orders = await Product.find(filter)
      .populate(populateFields, 'firstName lastName email avatar')
      .sort({ soldAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
});

// @desc    Get public user profile
// @route   GET /api/users/:userId/profile
// @access  Public
router.get('/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-email -phone -address -lastLogin -resetPasswordToken -resetPasswordExpire')
      .lean();

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's active listings (for sellers)
    let activeListings = [];
    if (user.role === 'seller') {
      activeListings = await Product.find({
        seller: userId,
        status: { $in: ['active', 'scheduled'] },
        isActive: true
      })
      .select('title images currentBid auctionEndDate totalBids')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();
    }

    // Get user statistics
    const stats = {
      totalListings: 0,
      totalSales: 0,
      averageRating: user.averageRating || 0,
      totalRatings: user.totalRatings || 0,
      memberSince: user.createdAt
    };

    if (user.role === 'seller') {
      const [listingsCount, salesCount] = await Promise.all([
        Product.countDocuments({ 
          seller: userId, 
          isActive: true 
        }),
        Product.countDocuments({ 
          seller: userId, 
          status: 'sold',
          isActive: true 
        })
      ]);

      stats.totalListings = listingsCount;
      stats.totalSales = salesCount;
    }

    res.json({
      success: true,
      data: {
        user,
        stats,
        activeListings
      }
    });
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user profile'
    });
  }
});

// @desc    Get user's public listings
// @route   GET /api/users/:userId/listings
// @access  Public
router.get('/:userId/listings', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['active', 'scheduled', 'ended', 'sold'])
], async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Verify user exists and is a seller
    const user = await User.findById(userId).select('role isActive');
    if (!user || !user.isActive || user.role !== 'seller') {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    const filter = {
      seller: userId,
      isActive: true
    };

    if (req.query.status) {
      filter.status = req.query.status;
    } else {
      filter.status = { $in: ['active', 'scheduled', 'ended', 'sold'] };
    }

    const products = await Product.find(filter)
      .populate('highestBidder', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get user listings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user listings'
    });
  }
});

module.exports = router;