const Bid = require('../models/Bid');
const Auction = require('../models/Auction');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { asyncHandler, AppError, formatValidationErrors } = require('../middleware/errorHandler');

// @desc    Get bids for a specific auction
// @route   GET /api/bids/auction/:auctionId
// @access  Public
const getAuctionBids = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;
  
  const auction = await Auction.findById(req.params.auctionId);
  if (!auction) {
    return next(new AppError('Auction not found', 404));
  }
  
  const bids = await Bid.find({ 
    auction: req.params.auctionId,
    isValid: true 
  })
    .populate('bidder', 'name')
    .sort({ amount: -1, bidTime: -1 })
    .limit(limit)
    .skip(startIndex)
    .select('-ipAddress -userAgent');
  
  const total = await Bid.countDocuments({ 
    auction: req.params.auctionId,
    isValid: true 
  });
  
  res.status(200).json({
    success: true,
    count: bids.length,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      total
    },
    data: bids
  });
});

// @desc    Get user's bids
// @route   GET /api/bids/user/my-bids
// @access  Private
const getMyBids = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;
  
  let query = { bidder: req.user._id };
  
  // Filter by status if provided
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  const bids = await Bid.find(query)
    .populate('auction', 'title images endTime status currentPrice')
    .sort({ bidTime: -1 })
    .limit(limit)
    .skip(startIndex)
    .select('-ipAddress -userAgent');
  
  const total = await Bid.countDocuments(query);
  
  res.status(200).json({
    success: true,
    count: bids.length,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      total
    },
    data: bids
  });
});

// @desc    Get single bid
// @route   GET /api/bids/:id
// @access  Private
const getBid = asyncHandler(async (req, res, next) => {
  const bid = await Bid.findById(req.params.id)
    .populate('auction', 'title images seller')
    .populate('bidder', 'name');
  
  if (!bid) {
    return next(new AppError('Bid not found', 404));
  }
  
  // Check if user owns the bid or is the auction seller or admin
  if (
    bid.bidder._id.toString() !== req.user._id.toString() &&
    bid.auction.seller.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return next(new AppError('Access denied', 403));
  }
  
  res.status(200).json({
    success: true,
    data: bid
  });
});

// @desc    Place a bid
// @route   POST /api/bids/:auctionId
// @access  Private
const placeBid = asyncHandler(async (req, res, next) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formatValidationErrors(errors)
    });
  }
  
  const { amount, maxBid, bidType = 'manual' } = req.body;
  const auction = req.auction; // From checkAuctionActive middleware
  const user = req.user;
  
  // Get client IP
  const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  
  // Validate bid amount
  let minimumBid = auction.currentPrice;
  if (auction.totalBids > 0) {
    const increment = Math.max(1, auction.currentPrice * 0.05); // 5% increment or $1 minimum
    minimumBid = auction.currentPrice + increment;
  } else {
    minimumBid = auction.startingPrice;
  }
  
  if (bidType !== 'buy_now' && amount < minimumBid) {
    return next(new AppError(`Bid must be at least $${minimumBid.toFixed(2)}`, 400));
  }
  
  // Check for buy now bid
  if (bidType === 'buy_now') {
    if (!auction.buyNowPrice) {
      return next(new AppError('Buy now option is not available for this auction', 400));
    }
    if (amount !== auction.buyNowPrice) {
      return next(new AppError('Buy now amount must match the buy now price', 400));
    }
  }
  
  // Check if user has sufficient funds (if implementing wallet system)
  // This would integrate with payment processing
  
  // Check for bid increment if there are existing bids
  if (auction.totalBids > 0) {
    const lastBid = await Bid.findOne({ 
      auction: auction._id, 
      isWinning: true 
    }).populate('bidder', 'name');
    
    if (lastBid && lastBid.bidder._id.toString() === user._id.toString()) {
      return next(new AppError('You are already the highest bidder', 400));
    }
  }
  
  // Create the bid
  const bidData = {
    auction: auction._id,
    bidder: user._id,
    amount,
    bidType,
    ipAddress,
    userAgent: req.get('User-Agent')
  };
  
  if (maxBid && bidType === 'automatic') {
    bidData.maxBid = maxBid;
    bidData.isProxyBid = true;
  }
  
  const bid = await Bid.create(bidData);
  
  // Populate the bid for response
  await bid.populate('bidder', 'name');
  await bid.populate('auction', 'title currentPrice totalBids');
  
  // Handle buy now - end auction immediately
  if (bidType === 'buy_now') {
    auction.status = 'sold';
    auction.winner = user._id;
    auction.endTime = new Date();
    await auction.save();
    
    // Emit socket event for auction end
    const { io } = require('../../server');
    if (io) {
      io.to(`auction-${auction._id}`).emit('auction-ended', {
        auctionId: auction._id,
        winner: user._id,
        finalPrice: amount,
        type: 'buy_now'
      });
    }
  }
  
  res.status(201).json({
    success: true,
    message: bidType === 'buy_now' ? 'Item purchased successfully!' : 'Bid placed successfully!',
    data: {
      bid,
      auction: {
        _id: auction._id,
        currentPrice: auction.currentPrice,
        totalBids: auction.totalBids,
        timeRemaining: auction.endTime - new Date(),
        status: auction.status
      }
    }
  });
});

// @desc    Retract a bid (if allowed within time limit)
// @route   PATCH /api/bids/:id/retract
// @access  Private
const retractBid = asyncHandler(async (req, res, next) => {
  const bid = await Bid.findById(req.params.id)
    .populate('auction', 'endTime status totalBids');
  
  if (!bid) {
    return next(new AppError('Bid not found', 404));
  }
  
  // Check ownership
  if (bid.bidder.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only retract your own bids', 403));
  }
  
  // Check if bid can be retracted
  if (bid.isRetracted) {
    return next(new AppError('Bid has already been retracted', 400));
  }
  
  if (bid.status !== 'winning' && bid.status !== 'active') {
    return next(new AppError('Only active or winning bids can be retracted', 400));
  }
  
  // Check time limit - can only retract within 1 hour of placing bid
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  if (bid.bidTime < oneHourAgo) {
    return next(new AppError('Bids can only be retracted within 1 hour of placing', 400));
  }
  
  // Check if auction is ending soon
  const auction = bid.auction;
  const timeRemaining = auction.endTime - new Date();
  if (timeRemaining <= 3600000) { // 1 hour remaining
    return next(new AppError('Cannot retract bid when auction has less than 1 hour remaining', 400));
  }
  
  // Retract the bid
  bid.isRetracted = true;
  bid.retractionReason = req.body.reason || 'User retraction';
  bid.retractedAt = new Date();
  bid.status = 'lost';
  
  await bid.save();
  
  // Find the next highest valid bid and update auction
  const nextHighestBid = await Bid.findOne({
    auction: auction._id,
    isRetracted: false,
    isValid: true,
    _id: { $ne: bid._id }
  }).sort({ amount: -1 });
  
  if (nextHighestBid) {
    auction.currentPrice = nextHighestBid.amount;
    auction.highestBid = nextHighestBid._id;
    nextHighestBid.status = 'winning';
    nextHighestBid.isWinning = true;
    await nextHighestBid.save();
  } else {
    auction.currentPrice = auction.startingPrice;
    auction.highestBid = null;
  }
  
  auction.totalBids -= 1;
  await auction.save();
  
  // Emit socket event
  const { io } = require('../../server');
  if (io) {
    io.to(`auction-${auction._id}`).emit('bid-retracted', {
      auctionId: auction._id,
      currentPrice: auction.currentPrice,
      totalBids: auction.totalBids
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Bid retracted successfully'
  });
});

// @desc    Get all bids (Admin only)
// @route   GET /api/bids
// @access  Private (Admin only)
const getAllBids = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const startIndex = (page - 1) * limit;
  
  let query = {};
  
  // Filtering
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  if (req.query.isValid !== undefined) {
    query.isValid = req.query.isValid === 'true';
  }
  
  if (req.query.auction) {
    query.auction = req.query.auction;
  }
  
  const bids = await Bid.find(query)
    .populate('auction', 'title')
    .populate('bidder', 'name email')
    .sort({ bidTime: -1 })
    .limit(limit)
    .skip(startIndex);
  
  const total = await Bid.countDocuments(query);
  
  res.status(200).json({
    success: true,
    count: bids.length,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      total
    },
    data: bids
  });
});

// @desc    Validate/Invalidate bid (Admin only)
// @route   PATCH /api/bids/:id/validate
// @access  Private (Admin only)
const validateBid = asyncHandler(async (req, res, next) => {
  const { isValid, validationNotes } = req.body;
  
  const bid = await Bid.findByIdAndUpdate(
    req.params.id,
    { 
      isValid: isValid !== undefined ? isValid : true,
      validationNotes
    },
    { new: true }
  ).populate('auction', 'title')
   .populate('bidder', 'name email');
  
  if (!bid) {
    return next(new AppError('Bid not found', 404));
  }
  
  res.status(200).json({
    success: true,
    message: `Bid ${isValid ? 'validated' : 'invalidated'} successfully`,
    data: bid
  });
});

module.exports = {
  getAuctionBids,
  getMyBids,
  getBid,
  placeBid,
  retractBid,
  getAllBids,
  validateBid
};
