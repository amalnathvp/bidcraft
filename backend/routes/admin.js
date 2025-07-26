const express = require('express');
const { body, query, validationResult } = require('express-validator');
const User = require('../models/User');
const Product = require('../models/Product');
const Bid = require('../models/Bid');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.use(protect, authorize('admin'));

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalBids,
      activeAuctions,
      totalRevenue,
      recentUsers,
      recentProducts,
      topSellers
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true }),
      Bid.countDocuments({ isActive: true }),
      Product.countDocuments({ 
        status: 'active',
        isActive: true 
      }),
      Product.aggregate([
        { 
          $match: { 
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
      User.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('firstName lastName email role createdAt'),
      Product.find({ isActive: true })
        .populate('seller', 'firstName lastName shopName')
        .sort({ createdAt: -1 })
        .limit(5),
      User.aggregate([
        { 
          $match: { 
            role: 'seller',
            isActive: true 
          } 
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: 'seller',
            as: 'products'
          }
        },
        {
          $addFields: {
            totalSales: {
              $size: {
                $filter: {
                  input: '$products',
                  cond: { $eq: ['$$this.status', 'sold'] }
                }
              }
            },
            totalRevenue: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$products',
                      cond: { $eq: ['$$this.status', 'sold'] }
                    }
                  },
                  as: 'product',
                  in: '$$product.finalPrice'
                }
              }
            }
          }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 },
        {
          $project: {
            firstName: 1,
            lastName: 1,
            shopName: 1,
            totalSales: 1,
            totalRevenue: 1
          }
        }
      ])
    ]);

    const stats = {
      totalUsers,
      totalProducts,
      totalBids,
      activeAuctions,
      totalRevenue: totalRevenue[0]?.total || 0,
      recentUsers,
      recentProducts,
      topSellers
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data'
    });
  }
});

// @desc    Get all users with filtering and pagination
// @route   GET /api/admin/users
// @access  Private (Admin only)
router.get('/users', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['buyer', 'seller', 'admin']),
  query('isActive').optional().isBoolean(),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    
    if (req.query.role) {
      filter.role = req.query.role;
    }

    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { shopName: searchRegex }
      ];
    }

    const users = await User.find(filter)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(filter);

    // Add statistics for each user
    for (let user of users) {
      if (user.role === 'seller') {
        const [totalListings, totalSales] = await Promise.all([
          Product.countDocuments({ seller: user._id, isActive: true }),
          Product.countDocuments({ seller: user._id, status: 'sold', isActive: true })
        ]);
        user.stats = { totalListings, totalSales };
      } else {
        const [totalBids, wonAuctions] = await Promise.all([
          Bid.countDocuments({ bidder: user._id, isActive: true }),
          Product.countDocuments({ soldTo: user._id, isActive: true })
        ]);
        user.stats = { totalBids, wonAuctions };
      }
    }

    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// @desc    Update user status
// @route   PUT /api/admin/users/:userId/status
// @access  Private (Admin only)
router.put('/users/:userId/status', [
  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  body('reason').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const { isActive, reason } = req.body;

    // Prevent admin from deactivating themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify your own account status'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user status'
    });
  }
});

// @desc    Get all products with filtering
// @route   GET /api/admin/products
// @access  Private (Admin only)
router.get('/products', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['draft', 'scheduled', 'active', 'ended', 'sold', 'cancelled']),
  query('category').optional().trim(),
  query('featured').optional().isBoolean(),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { isActive: true };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.featured !== undefined) {
      filter.featured = req.query.featured === 'true';
    }

    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    const products = await Product.find(filter)
      .populate('seller', 'firstName lastName shopName email')
      .populate('highestBidder', 'firstName lastName email')
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
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products'
    });
  }
});

// @desc    Update product featured status
// @route   PUT /api/admin/products/:productId/featured
// @access  Private (Admin only)
router.put('/products/:productId/featured', [
  body('featured').isBoolean().withMessage('featured must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { productId } = req.params;
    const { featured } = req.body;

    const product = await Product.findByIdAndUpdate(
      productId,
      { featured },
      { new: true, runValidators: true }
    ).populate('seller', 'firstName lastName shopName');

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: `Product ${featured ? 'featured' : 'unfeatured'} successfully`,
      data: product
    });
  } catch (error) {
    console.error('Update product featured error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating product'
    });
  }
});

// @desc    Delete product (admin override)
// @route   DELETE /api/admin/products/:productId
// @access  Private (Admin only)
router.delete('/products/:productId', [
  body('reason').optional().trim()
], async (req, res) => {
  try {
    const { productId } = req.params;
    const { reason } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Soft delete by setting isActive to false
    await Product.findByIdAndUpdate(productId, { 
      isActive: false,
      status: 'cancelled'
    });

    // Also deactivate all related bids
    await Bid.updateMany(
      { product: productId },
      { isActive: false, withdrawalReason: `Admin removal: ${reason || 'Violates platform policies'}` }
    );

    res.json({
      success: true,
      message: 'Product removed successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting product'
    });
  }
});

// @desc    Get platform analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
router.get('/analytics', [
  query('period').optional().isIn(['week', 'month', 'quarter', 'year']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const period = req.query.period || 'month';
    let startDate, endDate;

    if (req.query.startDate && req.query.endDate) {
      startDate = new Date(req.query.startDate);
      endDate = new Date(req.query.endDate);
    } else {
      endDate = new Date();
      switch (period) {
        case 'week':
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, endDate.getDate());
          break;
        case 'quarter':
          startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 3, endDate.getDate());
          break;
        case 'year':
          startDate = new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate());
          break;
      }
    }

    const [
      userGrowth,
      productMetrics,
      revenueData,
      categoryStats
    ] = await Promise.all([
      // User growth over time
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            isActive: true
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt"
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Product and bidding metrics
      Product.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            isActive: true
          }
        },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            averageStartingBid: { $avg: '$startingBid' },
            averageFinalPrice: { $avg: '$finalPrice' },
            totalViews: { $sum: '$views' }
          }
        }
      ]),

      // Revenue over time
      Product.aggregate([
        {
          $match: {
            soldAt: { $gte: startDate, $lte: endDate },
            status: 'sold',
            isActive: true
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$soldAt"
              }
            },
            revenue: { $sum: '$finalPrice' },
            sales: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Category distribution
      Product.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            isActive: true
          }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalRevenue: {
              $sum: {
                $cond: [
                  { $eq: ['$status', 'sold'] },
                  '$finalPrice',
                  0
                ]
              }
            }
          }
        },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        userGrowth,
        productMetrics: productMetrics[0] || {},
        revenueData,
        categoryStats
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics'
    });
  }
});

module.exports = router;