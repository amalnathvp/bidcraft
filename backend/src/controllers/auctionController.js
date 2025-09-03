const Auction = require('../models/Auction');
const Category = require('../models/Category');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { asyncHandler, AppError, formatValidationErrors } = require('../middleware/errorHandler');

// @desc    Get all auctions with filtering and pagination
// @route   GET /api/auctions
// @access  Public
const getAuctions = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;
  
  // Build query object
  let query = { status: 'active' };
  
  // Filtering
  if (req.query.category) {
    query.category = req.query.category;
  }
  
  if (req.query.condition) {
    query.condition = req.query.condition;
  }
  
  if (req.query.minPrice || req.query.maxPrice) {
    query.currentPrice = {};
    if (req.query.minPrice) {
      query.currentPrice.$gte = parseFloat(req.query.minPrice);
    }
    if (req.query.maxPrice) {
      query.currentPrice.$lte = parseFloat(req.query.maxPrice);
    }
  }
  
  if (req.query.endingSoon === 'true') {
    const oneHour = new Date(Date.now() + 60 * 60 * 1000);
    query.endTime = { $lte: oneHour, $gt: new Date() };
  }
  
  // Sorting
  let sortBy = {};
  if (req.query.sortBy) {
    const sortField = req.query.sortBy;
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
    sortBy[sortField] = sortOrder;
  } else {
    sortBy.endTime = 1; // Default: ending soonest first
  }
  
  // Execute query
  const auctions = await Auction.find(query)
    .populate('category', 'name slug')
    .populate('seller', 'name shopName sellerRating')
    .populate('highestBid', 'amount bidder')
    .sort(sortBy)
    .limit(limit)
    .skip(startIndex)
    .select('-questions -adminNotes');
  
  // Get total count for pagination
  const total = await Auction.countDocuments(query);
  
  // Calculate pagination info
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  res.status(200).json({
    success: true,
    count: auctions.length,
    pagination: {
      page,
      pages: totalPages,
      total,
      hasNextPage,
      hasPrevPage,
      limit
    },
    data: auctions
  });
});

// @desc    Get single auction
// @route   GET /api/auctions/:id
// @access  Public
const getAuction = asyncHandler(async (req, res, next) => {
  const auction = await Auction.findById(req.params.id)
    .populate('category', 'name slug')
    .populate('seller', 'name shopName sellerRating totalSales')
    .populate('highestBid', 'amount bidder bidTime')
    .populate('bids', 'amount bidder bidTime', null, { sort: { amount: -1 }, limit: 10 })
    .populate('questions.user', 'name')
    .populate('watchers', 'name');
  
  if (!auction) {
    return next(new AppError('Auction not found', 404));
  }
  
  // Increment view count if user is not the seller
  if (!req.user || req.user._id.toString() !== auction.seller._id.toString()) {
    auction.views += 1;
    await auction.save({ validateBeforeSave: false });
  }
  
  // Check if user is watching this auction
  let isWatching = false;
  if (req.user) {
    isWatching = auction.watchers.some(watcher => 
      watcher._id.toString() === req.user._id.toString()
    );
  }
  
  res.status(200).json({
    success: true,
    data: {
      ...auction.toObject(),
      isWatching
    }
  });
});

// @desc    Create new auction
// @route   POST /api/auctions
// @access  Private (Seller only)
const createAuction = asyncHandler(async (req, res, next) => {
  console.log('=== CREATE AUCTION REQUEST ===');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Files:', req.files ? req.files.length : 0);
  console.log('User:', req.user ? req.user._id : 'No user');
  
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation errors found:', errors.array());
    console.log('📝 Detailed validation errors:', JSON.stringify(errors.array(), null, 2));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formatValidationErrors(errors)
    });
  }

  try {
    // Handle image uploads first
    let images = [];
    if (req.files && req.files.length > 0) {
      // Check if Cloudinary is properly configured
      const isCloudinaryConfigured = 
        process.env.CLOUDINARY_CLOUD_NAME && 
        process.env.CLOUDINARY_API_KEY && 
        process.env.CLOUDINARY_API_SECRET &&
        process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_name' &&
        process.env.CLOUDINARY_API_KEY !== 'your_cloudinary_api_key' &&
        process.env.CLOUDINARY_API_SECRET !== 'your_cloudinary_api_secret';

      if (isCloudinaryConfigured) {
        console.log('📤 Uploading images to Cloudinary...');
        const cloudinary = require('cloudinary').v2;
        
        const uploadPromises = req.files.map(file => {
          return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: 'bidcraft/auctions',
                transformation: [
                  { width: 800, height: 600, crop: 'fill' },
                  { quality: 'auto' },
                  { fetch_format: 'auto' }
                ],
                resource_type: 'image'
              },
              (error, result) => {
                if (error) {
                  reject(error);
                } else {
                  resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                    alt: `${req.body.title} image`
                  });
                }
              }
            );
            uploadStream.end(file.buffer);
          });
        });

        images = await Promise.all(uploadPromises);
        console.log('✅ Images uploaded to Cloudinary successfully');
      } else {
        // Development mode: Use placeholder images
        console.log('⚠️ Cloudinary not configured - using placeholder images for development');
        images = req.files.map((file, index) => ({
          url: `https://via.placeholder.com/800x600/cccccc/666666?text=Auction+Image+${index + 1}`,
          publicId: `placeholder_${Date.now()}_${index}`,
          alt: `${req.body.title} image ${index + 1}`
        }));
        console.log('📷 Created placeholder images:', images.length);
      }
    }

    // Add seller to req.body
    req.body.seller = req.user._id;
    req.body.images = images;
    
    // For quick listings, handle category as string and find/create category
    if (typeof req.body.category === 'string') {
      let category = await Category.findOne({ 
        $or: [
          { name: { $regex: new RegExp(req.body.category, 'i') } },
          { slug: req.body.category.toLowerCase() }
        ]
      });
      
      if (!category) {
        // Create a simple category if it doesn't exist
        category = await Category.create({
          name: req.body.category.charAt(0).toUpperCase() + req.body.category.slice(1),
          slug: req.body.category.toLowerCase(),
          description: `${req.body.category} items`
        });
      }
      req.body.category = category._id;
    }
    
    // Validate category exists
    const category = await Category.findById(req.body.category);
    if (!category) {
      return next(new AppError('Category not found', 404));
    }
    
    // Handle start and end times
    let startTime, endTime;
    if (req.body.startTime && req.body.endTime) {
      startTime = new Date(req.body.startTime);
      endTime = new Date(req.body.endTime);
    } else if (req.body.duration) {
      // For quick listings with duration in days
      startTime = new Date();
      endTime = new Date();
      endTime.setDate(endTime.getDate() + parseInt(req.body.duration));
    } else {
      return next(new AppError('Start time and end time, or duration is required', 400));
    }
    
    const now = new Date();
    
    if (startTime < now) {
      startTime = now; // Start immediately for quick listings
    }
    
    if (endTime <= startTime) {
      return next(new AppError('End time must be after start time', 400));
    }
    
    const duration = endTime - startTime;
    if (duration < 3600000) { // 1 hour minimum
      return next(new AppError('Auction duration must be at least 1 hour', 400));
    }
    
    req.body.startTime = startTime;
    req.body.endTime = endTime;
    req.body.duration = duration;
    req.body.status = 'active'; // Auto-activate quick listings

    const auction = await Auction.create(req.body);
    
    // Populate the created auction
    await auction.populate('category', 'name slug');
    await auction.populate('seller', 'name shopName');
    
    res.status(201).json({
      success: true,
      data: auction
    });

  } catch (error) {
    console.error('Auction creation error:', error);
    return next(new AppError('Error creating auction', 500));
  }
});

// @desc    Update auction
// @route   PUT /api/auctions/:id
// @access  Private (Seller/Admin only)
const updateAuction = asyncHandler(async (req, res, next) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formatValidationErrors(errors)
    });
  }
  
  const auction = req.resource; // From checkOwnership middleware
  
  // Check if auction can be updated
  if (auction.status === 'active' && auction.totalBids > 0) {
    return next(new AppError('Cannot update auction with active bids', 400));
  }
  
  if (auction.status === 'ended' || auction.status === 'sold') {
    return next(new AppError('Cannot update completed auction', 400));
  }
  
  // Remove fields that shouldn't be updated
  delete req.body.seller;
  delete req.body.totalBids;
  delete req.body.currentPrice;
  delete req.body.highestBid;
  delete req.body.winner;
  
  const updatedAuction = await Auction.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate('category', 'name slug')
   .populate('seller', 'name shopName');
  
  res.status(200).json({
    success: true,
    data: updatedAuction
  });
});

// @desc    Delete auction
// @route   DELETE /api/auctions/:id
// @access  Private (Seller/Admin only)
const deleteAuction = asyncHandler(async (req, res, next) => {
  const auction = req.resource; // From checkOwnership middleware
  
  // Check if auction can be deleted
  if (auction.status === 'active' && auction.totalBids > 0) {
    return next(new AppError('Cannot delete auction with active bids', 400));
  }
  
  if (auction.status === 'ended' || auction.status === 'sold') {
    return next(new AppError('Cannot delete completed auction', 400));
  }
  
  await auction.deleteOne();
  
  res.status(200).json({
    success: true,
    message: 'Auction deleted successfully'
  });
});

// @desc    Get featured auctions
// @route   GET /api/auctions/featured
// @access  Public
const getFeaturedAuctions = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  
  const auctions = await Auction.find({ 
    status: 'active', 
    featured: true 
  })
    .populate('category', 'name slug')
    .populate('seller', 'name shopName sellerRating')
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-questions -adminNotes');
  
  res.status(200).json({
    success: true,
    count: auctions.length,
    data: auctions
  });
});

// @desc    Get ending soon auctions
// @route   GET /api/auctions/ending-soon
// @access  Public
const getEndingSoonAuctions = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const oneHour = new Date(Date.now() + 60 * 60 * 1000);
  
  const auctions = await Auction.find({ 
    status: 'active',
    endTime: { $lte: oneHour, $gt: new Date() }
  })
    .populate('category', 'name slug')
    .populate('seller', 'name shopName sellerRating')
    .sort({ endTime: 1 })
    .limit(limit)
    .select('-questions -adminNotes');
  
  res.status(200).json({
    success: true,
    count: auctions.length,
    data: auctions
  });
});

// @desc    Search auctions
// @route   GET /api/auctions/search
// @access  Public
const searchAuctions = asyncHandler(async (req, res, next) => {
  const { q, category, minPrice, maxPrice, condition, page = 1, limit = 20 } = req.query;
  
  if (!q || q.trim().length < 2) {
    return next(new AppError('Search query must be at least 2 characters', 400));
  }
  
  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  
  // Build search query
  let query = {
    status: 'active',
    $text: { $search: q }
  };
  
  // Add filters
  if (category) query.category = category;
  if (condition) query.condition = condition;
  if (minPrice || maxPrice) {
    query.currentPrice = {};
    if (minPrice) query.currentPrice.$gte = parseFloat(minPrice);
    if (maxPrice) query.currentPrice.$lte = parseFloat(maxPrice);
  }
  
  const auctions = await Auction.find(query, { score: { $meta: 'textScore' } })
    .populate('category', 'name slug')
    .populate('seller', 'name shopName sellerRating')
    .sort({ score: { $meta: 'textScore' } })
    .limit(parseInt(limit))
    .skip(startIndex)
    .select('-questions -adminNotes');
  
  const total = await Auction.countDocuments(query);
  
  res.status(200).json({
    success: true,
    count: auctions.length,
    pagination: {
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total
    },
    data: auctions
  });
});

// @desc    Get auctions by category
// @route   GET /api/auctions/categories/:categoryId
// @access  Public
const getAuctionsByCategory = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;
  
  const category = await Category.findById(req.params.categoryId);
  if (!category) {
    return next(new AppError('Category not found', 404));
  }
  
  const auctions = await Auction.find({ 
    category: req.params.categoryId,
    status: 'active'
  })
    .populate('category', 'name slug')
    .populate('seller', 'name shopName sellerRating')
    .sort({ endTime: 1 })
    .limit(limit)
    .skip(startIndex)
    .select('-questions -adminNotes');
  
  const total = await Auction.countDocuments({ 
    category: req.params.categoryId,
    status: 'active'
  });
  
  res.status(200).json({
    success: true,
    count: auctions.length,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      total
    },
    category: category.name,
    data: auctions
  });
});

// @desc    Get seller's auctions
// @route   GET /api/auctions/seller/my-auctions
// @access  Private (Seller only)
const getMyAuctions = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;
  
  let query = { seller: req.user._id };
  
  // Filter by status if provided
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  const auctions = await Auction.find(query)
    .populate('category', 'name slug')
    .populate('highestBid', 'amount bidder')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(startIndex);
  
  const total = await Auction.countDocuments(query);
  
  res.status(200).json({
    success: true,
    count: auctions.length,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      total
    },
    data: auctions
  });
});

// @desc    Publish auction
// @route   PATCH /api/auctions/:id/publish
// @access  Private (Seller only)
const publishAuction = asyncHandler(async (req, res, next) => {
  const auction = req.resource; // From checkOwnership middleware
  
  if (auction.status !== 'draft') {
    return next(new AppError('Only draft auctions can be published', 400));
  }
  
  // Validate auction has required fields
  if (!auction.images || auction.images.length === 0) {
    return next(new AppError('At least one image is required to publish', 400));
  }
  
  const now = new Date();
  if (auction.startTime <= now) {
    auction.status = 'active';
  } else {
    auction.status = 'scheduled';
  }
  
  await auction.save();
  
  res.status(200).json({
    success: true,
    data: auction
  });
});

// @desc    Cancel auction
// @route   PATCH /api/auctions/:id/cancel
// @access  Private (Seller only)
const cancelAuction = asyncHandler(async (req, res, next) => {
  const auction = req.resource; // From checkOwnership middleware
  
  if (auction.status === 'ended' || auction.status === 'sold') {
    return next(new AppError('Cannot cancel completed auction', 400));
  }
  
  if (auction.status === 'active' && auction.totalBids > 0) {
    return next(new AppError('Cannot cancel auction with active bids', 400));
  }
  
  auction.status = 'cancelled';
  await auction.save();
  
  res.status(200).json({
    success: true,
    data: auction
  });
});

// @desc    Watch/Unwatch auction
// @route   POST/DELETE /api/auctions/:id/watch
// @access  Private
const watchAuction = asyncHandler(async (req, res, next) => {
  const auction = await Auction.findById(req.params.id);
  
  if (!auction) {
    return next(new AppError('Auction not found', 404));
  }
  
  const user = await User.findById(req.user._id);
  
  // Check if already watching
  if (user.watchlist.includes(auction._id)) {
    return next(new AppError('Already watching this auction', 400));
  }
  
  user.watchlist.push(auction._id);
  auction.watchers.push(user._id);
  
  await user.save();
  await auction.save();
  
  res.status(200).json({
    success: true,
    message: 'Auction added to watchlist'
  });
});

const unwatchAuction = asyncHandler(async (req, res, next) => {
  const auction = await Auction.findById(req.params.id);
  
  if (!auction) {
    return next(new AppError('Auction not found', 404));
  }
  
  const user = await User.findById(req.user._id);
  
  user.watchlist = user.watchlist.filter(id => id.toString() !== auction._id.toString());
  auction.watchers = auction.watchers.filter(id => id.toString() !== user._id.toString());
  
  await user.save();
  await auction.save();
  
  res.status(200).json({
    success: true,
    message: 'Auction removed from watchlist'
  });
});

// @desc    Ask question about auction
// @route   POST /api/auctions/:id/question
// @access  Private
const askQuestion = asyncHandler(async (req, res, next) => {
  const { question } = req.body;
  
  if (!question || question.trim().length < 10) {
    return next(new AppError('Question must be at least 10 characters', 400));
  }
  
  const auction = await Auction.findById(req.params.id);
  
  if (!auction) {
    return next(new AppError('Auction not found', 404));
  }
  
  auction.questions.push({
    user: req.user._id,
    question: question.trim()
  });
  
  await auction.save();
  
  res.status(201).json({
    success: true,
    message: 'Question submitted successfully'
  });
});

// @desc    Answer question about auction
// @route   PUT /api/auctions/:id/question/:questionId/answer
// @access  Private (Seller only)
const answerQuestion = asyncHandler(async (req, res, next) => {
  const { answer } = req.body;
  
  if (!answer || answer.trim().length < 5) {
    return next(new AppError('Answer must be at least 5 characters', 400));
  }
  
  const auction = req.resource; // From checkOwnership middleware
  const question = auction.questions.id(req.params.questionId);
  
  if (!question) {
    return next(new AppError('Question not found', 404));
  }
  
  question.answer = answer.trim();
  question.answeredAt = new Date();
  
  await auction.save();
  
  res.status(200).json({
    success: true,
    message: 'Question answered successfully'
  });
});

// @desc    Feature auction (Admin only)
// @route   PATCH /api/auctions/:id/feature
// @access  Private (Admin only)
const featureAuction = asyncHandler(async (req, res, next) => {
  const auction = await Auction.findByIdAndUpdate(
    req.params.id,
    { featured: req.body.featured || true },
    { new: true }
  );
  
  if (!auction) {
    return next(new AppError('Auction not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: auction
  });
});

// @desc    Report auction
// @route   PATCH /api/auctions/:id/report
// @access  Private
const reportAuction = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  
  if (!reason) {
    return next(new AppError('Reason for reporting is required', 400));
  }
  
  const auction = await Auction.findById(req.params.id);
  
  if (!auction) {
    return next(new AppError('Auction not found', 404));
  }
  
  auction.reported.count += 1;
  auction.reported.reasons.push(reason);
  
  await auction.save();
  
  res.status(200).json({
    success: true,
    message: 'Auction reported successfully'
  });
});

module.exports = {
  getAuctions,
  getAuction,
  createAuction,
  updateAuction,
  deleteAuction,
  getFeaturedAuctions,
  getEndingSoonAuctions,
  searchAuctions,
  getAuctionsByCategory,
  getMyAuctions,
  publishAuction,
  cancelAuction,
  watchAuction,
  unwatchAuction,
  askQuestion,
  answerQuestion,
  featureAuction,
  reportAuction
};
