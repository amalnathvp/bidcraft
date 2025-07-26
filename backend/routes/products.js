const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Product = require('../models/Product');
const Bid = require('../models/Bid');
const { protect, authorize, optionalAuth, checkOwnership } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all products with filtering, sorting and pagination
// @route   GET /api/products
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('category').optional().trim(),
  query('status').optional().isIn(['active', 'scheduled', 'ended']),
  query('featured').optional().isBoolean(),
  query('sortBy').optional().isIn(['newest', 'ending-soon', 'price-low', 'price-high', 'most-bids']),
  query('search').optional().trim()
], optionalAuth, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = { isActive: true };

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    } else {
      // Default to active auctions
      filter.status = { $in: ['active', 'scheduled'] };
    }

    if (req.query.featured === 'true') {
      filter.featured = true;
    }

    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // Build sort query
    let sort = {};
    switch (req.query.sortBy) {
      case 'ending-soon':
        sort = { auctionEndDate: 1 };
        break;
      case 'price-low':
        sort = { currentBid: 1 };
        break;
      case 'price-high':
        sort = { currentBid: -1 };
        break;
      case 'most-bids':
        sort = { totalBids: -1 };
        break;
      case 'newest':
      default:
        sort = { createdAt: -1 };
    }

    // Execute query
    const products = await Product.find(filter)
      .populate('seller', 'firstName lastName shopName avatar averageRating')
      .populate('highestBidder', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    // Add user-specific data if authenticated
    if (req.user) {
      for (let product of products) {
        product.isWatched = product.watchers.includes(req.user._id);
        product.userHasBid = await Bid.exists({
          product: product._id,
          bidder: req.user._id,
          isActive: true
        });
      }
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
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products'
    });
  }
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
router.get('/featured', optionalAuth, async (req, res) => {
  try {
    const products = await Product.find({
      featured: true,
      status: { $in: ['active', 'scheduled'] },
      isActive: true
    })
    .populate('seller', 'firstName lastName shopName avatar averageRating')
    .populate('highestBidder', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();

    // Add user-specific data if authenticated
    if (req.user) {
      for (let product of products) {
        product.isWatched = product.watchers.includes(req.user._id);
        product.userHasBid = await Bid.exists({
          product: product._id,
          bidder: req.user._id,
          isActive: true
        });
      }
    }

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching featured products'
    });
  }
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'firstName lastName shopName shopDescription avatar averageRating totalRatings')
      .populate('highestBidder', 'firstName lastName avatar')
      .lean();

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment view count
    await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    // Get bid history
    const bidHistory = await Bid.getBidHistory(req.params.id, 10);

    // Add user-specific data if authenticated
    if (req.user) {
      product.isWatched = product.watchers.includes(req.user._id);
      product.userHasBid = await Bid.exists({
        product: product._id,
        bidder: req.user._id,
        isActive: true
      });
    }

    res.json({
      success: true,
      data: {
        product,
        bidHistory
      }
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching product'
    });
  }
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Seller/Admin)
router.post('/', protect, authorize('seller', 'admin'), [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('description').trim().notEmpty().withMessage('Description is required')
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('category').notEmpty().withMessage('Category is required'),
  body('startingBid').isFloat({ min: 0.01 }).withMessage('Starting bid must be at least $0.01'),
  body('auctionStartDate').isISO8601().withMessage('Valid auction start date is required'),
  body('auctionEndDate').isISO8601().withMessage('Valid auction end date is required'),
  body('condition').isIn(['new', 'like-new', 'good', 'fair', 'poor']).withMessage('Valid condition is required'),
  body('images').isArray({ min: 1 }).withMessage('At least one image is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Validate dates
    const startDate = new Date(req.body.auctionStartDate);
    const endDate = new Date(req.body.auctionEndDate);
    const now = new Date();

    if (startDate < now) {
      return res.status(400).json({
        success: false,
        message: 'Auction start date cannot be in the past'
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: 'Auction end date must be after start date'
      });
    }

    const productData = {
      ...req.body,
      seller: req.user._id,
      currentBid: req.body.startingBid
    };

    const product = await Product.create(productData);

    const populatedProduct = await Product.findById(product._id)
      .populate('seller', 'firstName lastName shopName avatar');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: populatedProduct
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating product'
    });
  }
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Owner/Admin)
router.put('/:id', protect, checkOwnership(Product), [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty')
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('category').optional().notEmpty().withMessage('Category cannot be empty'),
  body('condition').optional().isIn(['new', 'like-new', 'good', 'fair', 'poor'])
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const product = req.resource;

    // Don't allow updates if auction has started and has bids
    if (product.status === 'active' && product.totalBids > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update product with active bids'
      });
    }

    // Only allow certain fields to be updated
    const allowedUpdates = [
      'title', 'description', 'category', 'subcategory', 'condition',
      'materials', 'dimensions', 'tags', 'images', 'shippingInfo'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('seller', 'firstName lastName shopName avatar');

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating product'
    });
  }
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Owner/Admin)
router.delete('/:id', protect, checkOwnership(Product), async (req, res) => {
  try {
    const product = req.resource;

    // Don't allow deletion if auction has bids
    if (product.totalBids > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete product with existing bids'
      });
    }

    // Soft delete by setting isActive to false
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting product'
    });
  }
});

// @desc    Watch/Unwatch product
// @route   POST /api/products/:id/watch
// @access  Private
router.post('/:id/watch', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const isWatching = product.watchers.includes(req.user._id);

    if (isWatching) {
      // Remove from watchers
      product.watchers = product.watchers.filter(
        watcherId => watcherId.toString() !== req.user._id.toString()
      );
    } else {
      // Add to watchers
      product.watchers.push(req.user._id);
    }

    await product.save();

    res.json({
      success: true,
      message: isWatching ? 'Removed from watchlist' : 'Added to watchlist',
      isWatching: !isWatching
    });
  } catch (error) {
    console.error('Watch product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating watchlist'
    });
  }
});

// @desc    Get categories
// @route   GET /api/products/categories
// @access  Public
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = [
      { value: 'pottery', label: 'Pottery & Ceramics' },
      { value: 'jewelry', label: 'Jewelry' },
      { value: 'textiles', label: 'Textiles & Fabrics' },
      { value: 'woodwork', label: 'Woodwork' },
      { value: 'metalwork', label: 'Metalwork' },
      { value: 'glasswork', label: 'Glasswork' },
      { value: 'leatherwork', label: 'Leatherwork' },
      { value: 'painting', label: 'Painting' },
      { value: 'sculpture', label: 'Sculpture' },
      { value: 'home-decor', label: 'Home Decor' },
      { value: 'accessories', label: 'Accessories' },
      { value: 'other', label: 'Other' }
    ];

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories'
    });
  }
});

module.exports = router;