const Auction = require('../models/Auction');
const Category = require('../models/Category');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { asyncHandler, AppError, formatValidationErrors } = require('../middleware/errorHandler');

// @desc    Get featured items
// @route   GET /api/items/featured
// @access  Public
const getFeaturedItems = asyncHandler(async (req, res, next) => {
  const featuredItems = await Auction.find({
    status: 'active',
    isFeatured: true
  })
    .populate('seller', 'name shopName avatar sellerRating')
    .populate('category', 'name')
    .sort({ featuredPriority: -1, currentPrice: -1 })
    .limit(12)
    .select('title description images currentPrice endTime bidCount watchers condition');

  res.status(200).json({
    success: true,
    count: featuredItems.length,
    data: featuredItems
  });
});

// @desc    Get trending items
// @route   GET /api/items/trending
// @access  Public
const getTrendingItems = asyncHandler(async (req, res, next) => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const trendingItems = await Auction.find({
    status: 'active',
    updatedAt: { $gte: oneDayAgo }
  })
    .populate('seller', 'name shopName avatar')
    .populate('category', 'name')
    .sort({ bidCount: -1, watchers: -1 })
    .limit(10)
    .select('title images currentPrice endTime bidCount watchers');

  res.status(200).json({
    success: true,
    count: trendingItems.length,
    data: trendingItems
  });
});

// @desc    Get ending soon items
// @route   GET /api/items/ending-soon
// @access  Public
const getEndingSoonItems = asyncHandler(async (req, res, next) => {
  const sixHoursFromNow = new Date(Date.now() + 6 * 60 * 60 * 1000);
  
  const endingSoonItems = await Auction.find({
    status: 'active',
    endTime: { $lte: sixHoursFromNow, $gt: new Date() }
  })
    .populate('seller', 'name shopName avatar')
    .populate('category', 'name')
    .sort({ endTime: 1 })
    .limit(15)
    .select('title images currentPrice endTime bidCount condition');

  res.status(200).json({
    success: true,
    count: endingSoonItems.length,
    data: endingSoonItems
  });
});

// @desc    Get hot items (high activity)
// @route   GET /api/items/hot
// @access  Public
const getHotItems = asyncHandler(async (req, res, next) => {
  const hotItems = await Auction.find({
    status: 'active',
    bidCount: { $gte: 5 }
  })
    .populate('seller', 'name shopName avatar')
    .populate('category', 'name')
    .sort({ bidCount: -1, watchers: -1, currentPrice: -1 })
    .limit(20)
    .select('title images currentPrice startingPrice endTime bidCount watchers condition');

  res.status(200).json({
    success: true,
    count: hotItems.length,
    data: hotItems
  });
});

// @desc    Get recently listed items
// @route   GET /api/items/recent
// @access  Public
const getRecentItems = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  
  const recentItems = await Auction.find({
    status: 'active'
  })
    .populate('seller', 'name shopName avatar')
    .populate('category', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('title images currentPrice endTime condition createdAt');

  res.status(200).json({
    success: true,
    count: recentItems.length,
    data: recentItems
  });
});

// @desc    Search items with advanced filters
// @route   GET /api/items/search
// @access  Public
const searchItems = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;
  
  let query = { status: 'active' };
  
  // Text search
  if (req.query.q) {
    query.$or = [
      { title: { $regex: req.query.q, $options: 'i' } },
      { description: { $regex: req.query.q, $options: 'i' } },
      { tags: { $in: [new RegExp(req.query.q, 'i')] } }
    ];
  }
  
  // Category filter
  if (req.query.category) {
    query.category = req.query.category;
  }
  
  // Condition filter
  if (req.query.condition) {
    query.condition = { $in: req.query.condition.split(',') };
  }
  
  // Price range filter
  if (req.query.minPrice || req.query.maxPrice) {
    query.currentPrice = {};
    if (req.query.minPrice) {
      query.currentPrice.$gte = parseFloat(req.query.minPrice);
    }
    if (req.query.maxPrice) {
      query.currentPrice.$lte = parseFloat(req.query.maxPrice);
    }
  }
  
  // Location filter
  if (req.query.location) {
    query['seller.address.city'] = { $regex: req.query.location, $options: 'i' };
  }
  
  // Ending time filter
  if (req.query.endingWithin) {
    const hours = parseInt(req.query.endingWithin);
    const endTime = new Date(Date.now() + hours * 60 * 60 * 1000);
    query.endTime = { $lte: endTime, $gt: new Date() };
  }
  
  // Buy Now available
  if (req.query.buyNow === 'true') {
    query.buyNowPrice = { $exists: true, $ne: null };
  }
  
  // Sorting
  let sortBy = {};
  switch (req.query.sortBy) {
    case 'price_low':
      sortBy.currentPrice = 1;
      break;
    case 'price_high':
      sortBy.currentPrice = -1;
      break;
    case 'ending_soon':
      sortBy.endTime = 1;
      break;
    case 'most_bids':
      sortBy.bidCount = -1;
      break;
    case 'most_watched':
      sortBy.watchers = -1;
      break;
    case 'newest':
      sortBy.createdAt = -1;
      break;
    default:
      sortBy.endTime = 1; // Default: ending soonest first
  }
  
  const items = await Auction.find(query)
    .populate('seller', 'name shopName avatar sellerRating')
    .populate('category', 'name')
    .sort(sortBy)
    .limit(limit)
    .skip(startIndex)
    .select('title description images currentPrice startingPrice buyNowPrice endTime bidCount watchers condition tags');
  
  const total = await Auction.countDocuments(query);
  
  res.status(200).json({
    success: true,
    count: items.length,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      total
    },
    data: items
  });
});

// @desc    Get item recommendations
// @route   GET /api/items/:itemId/recommendations
// @access  Public
const getItemRecommendations = asyncHandler(async (req, res, next) => {
  const item = await Auction.findById(req.params.itemId)
    .populate('category');
  
  if (!item) {
    return next(new AppError('Item not found', 404));
  }
  
  // Find similar items based on category, tags, and price range
  const priceRange = item.currentPrice * 0.5; // ±50% price range
  
  const recommendations = await Auction.find({
    _id: { $ne: item._id },
    status: 'active',
    $or: [
      { category: item.category._id },
      { tags: { $in: item.tags } },
      { 
        currentPrice: { 
          $gte: item.currentPrice - priceRange,
          $lte: item.currentPrice + priceRange
        }
      }
    ]
  })
    .populate('seller', 'name shopName avatar')
    .populate('category', 'name')
    .sort({ bidCount: -1, watchers: -1 })
    .limit(8)
    .select('title images currentPrice endTime bidCount condition');

  res.status(200).json({
    success: true,
    count: recommendations.length,
    data: recommendations
  });
});

// @desc    Get items by seller
// @route   GET /api/items/seller/:sellerId
// @access  Public
const getItemsBySeller = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;
  
  const seller = await User.findById(req.params.sellerId);
  if (!seller) {
    return next(new AppError('Seller not found', 404));
  }
  
  let query = { seller: req.params.sellerId };
  
  // Status filter
  if (req.query.status) {
    query.status = req.query.status;
  } else {
    query.status = 'active'; // Default to active auctions
  }
  
  const items = await Auction.find(query)
    .populate('category', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(startIndex)
    .select('title images currentPrice startingPrice endTime bidCount status condition');
  
  const total = await Auction.countDocuments(query);
  
  // Get seller statistics
  const sellerStats = await Auction.aggregate([
    { $match: { seller: seller._id } },
    {
      $group: {
        _id: null,
        totalAuctions: { $sum: 1 },
        activeAuctions: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        completedAuctions: {
          $sum: { $cond: [{ $eq: ['$status', 'ended'] }, 1, 0] }
        },
        totalValue: { $sum: '$currentPrice' }
      }
    }
  ]);
  
  res.status(200).json({
    success: true,
    count: items.length,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      total
    },
    seller: {
      id: seller._id,
      name: seller.name,
      shopName: seller.shopName,
      avatar: seller.avatar,
      sellerRating: seller.sellerRating,
      stats: sellerStats[0] || {}
    },
    data: items
  });
});

module.exports = {
  getFeaturedItems,
  getTrendingItems,
  getEndingSoonItems,
  getHotItems,
  getRecentItems,
  searchItems,
  getItemRecommendations,
  getItemsBySeller
};
