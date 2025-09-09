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
  
  // Update auction with new bid
  if (bidType !== 'buy_now') {
    // Mark previous winning bid as not winning
    await Bid.updateMany(
      { auction: auction._id, isWinning: true },
      { isWinning: false }
    );
    
    // Mark this bid as winning
    bid.isWinning = true;
    await bid.save();
    
    // Update auction current price and bid count
    auction.currentPrice = amount;
    auction.totalBids = (auction.totalBids || 0) + 1;
    await auction.save();
    
    // ===== ENHANCED REAL-TIME BID UPDATES =====
    if (global.socketService) {
      console.log(`📡 Emitting real-time bid updates for auction ${auction._id}`);
      
      // 1. Emit to live auction room (active bidders)
      global.socketService.emitLiveAuctionUpdate(auction._id, {
        eventType: 'new-bid',
        newCurrentPrice: amount,
        totalBids: auction.totalBids,
        leadingBidder: {
          id: user._id,
          name: user.name
        },
        bidTime: bid.bidTime,
        bidIncrement: amount - (auction.currentPrice - amount),
        isProxyBid: bidType === 'automatic'
      });
      
      // 2. Emit to general auction room (viewers)
      global.socketService.emitAuctionUpdate(auction._id, 'bid-placed', {
        amount,
        bidderName: user.name,
        newCurrentPrice: amount,
        totalBids: auction.totalBids,
        timeRemaining: Math.max(0, auction.endTime - new Date()),
        bidType
      });
      
      // 3. Notify auction seller with detailed information
      global.socketService.emitToUser(auction.seller.toString(), 'new-bid-notification', {
        auctionId: auction._id,
        auctionTitle: auction.title,
        bidAmount: amount,
        bidderName: user.name,
        totalBids: auction.totalBids,
        bidType,
        timeRemaining: Math.max(0, auction.endTime - new Date()),
        previousPrice: auction.currentPrice - amount
      });
      
      // 4. Notify outbid users (previous highest bidders)
      const previousHighestBids = await Bid.find({
        auction: auction._id,
        isValid: true,
        bidder: { $ne: user._id },
        amount: { $gte: auction.currentPrice * 0.8 } // Recent high bidders
      }).populate('bidder', '_id').distinct('bidder');
      
      previousHighestBids.forEach(previousBidderId => {
        global.socketService.emitToUser(previousBidderId.toString(), 'outbid-notification', {
          auctionId: auction._id,
          auctionTitle: auction.title,
          yourBid: auction.currentPrice - amount,
          newHighestBid: amount,
          bidderName: user.name,
          timeRemaining: Math.max(0, auction.endTime - new Date())
        });
      });
      
      // 5. Broadcast to watchers (users who bookmarked the auction)
      if (auction.watchers && auction.watchers.length > 0) {
        auction.watchers.forEach(watcherId => {
          global.socketService.emitToUser(watcherId.toString(), 'watched-auction-bid', {
            auctionId: auction._id,
            auctionTitle: auction.title,
            newBidAmount: amount,
            bidderName: user.name,
            totalBids: auction.totalBids
          });
        });
      }
    } else {
      console.warn('⚠️ Global socket service not available for real-time updates');
    }
  }
  
  // Handle buy now - end auction immediately
  if (bidType === 'buy_now') {
    auction.status = 'sold';
    auction.winner = user._id;
    auction.endTime = new Date();
    auction.currentPrice = amount;
    await auction.save();
    
    // ===== ENHANCED BUY NOW REAL-TIME UPDATES =====
    if (global.socketService) {
      console.log(`💰 Emitting buy-now completion for auction ${auction._id}`);
      
      // 1. Notify all auction viewers that auction ended
      global.socketService.emitAuctionUpdate(auction._id, 'auction-ended', {
        winner: {
          id: user._id,
          name: user.name
        },
        finalPrice: amount,
        endType: 'buy_now',
        endedAt: new Date()
      });
      
      // 2. Notify live bidders that auction ended
      global.socketService.emitLiveAuctionUpdate(auction._id, {
        eventType: 'auction-ended',
        winner: {
          id: user._id,
          name: user.name
        },
        finalPrice: amount,
        endType: 'buy_now',
        endedAt: new Date()
      });
      
      // 3. Notify seller with sale details
      global.socketService.emitToUser(auction.seller.toString(), 'auction-sold', {
        auctionId: auction._id,
        auctionTitle: auction.title,
        finalPrice: amount,
        buyerName: user.name,
        buyerId: user._id,
        saleType: 'buy_now',
        soldAt: new Date(),
        commissionRate: 0.05, // Example commission rate
        sellerEarnings: amount * 0.95
      });
      
      // 4. Notify buyer with purchase confirmation
      global.socketService.emitToUser(user._id.toString(), 'purchase-confirmed', {
        auctionId: auction._id,
        auctionTitle: auction.title,
        purchasePrice: amount,
        sellerName: auction.seller.name || 'Seller',
        purchaseType: 'buy_now',
        purchasedAt: new Date()
      });
      
      // 5. Notify all watchers that item was sold
      if (auction.watchers && auction.watchers.length > 0) {
        auction.watchers.forEach(watcherId => {
          if (watcherId.toString() !== user._id.toString()) {
            global.socketService.emitToUser(watcherId.toString(), 'watched-auction-ended', {
              auctionId: auction._id,
              auctionTitle: auction.title,
              endType: 'buy_now',
              finalPrice: amount,
              winnerName: user.name
            });
          }
        });
      }
      
      // 6. Broadcast system-wide for featured auctions
      if (auction.isFeatured) {
        global.socketService.broadcastAnnouncement({
          type: 'featured_sold',
          message: `Featured item "${auction.title}" sold via Buy Now for $${amount}`,
          auctionId: auction._id
        });
      }
    } else {
      console.warn('⚠️ Global socket service not available for buy-now updates');
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
  
  // ===== ENHANCED BID RETRACTION REAL-TIME UPDATES =====
  if (global.socketService) {
    console.log(`🔄 Emitting bid retraction updates for auction ${auction._id}`);
    
    // 1. Notify auction viewers of bid retraction
    global.socketService.emitAuctionUpdate(auction._id, 'bid-retracted', {
      retractedBidAmount: bid.amount,
      retractedBy: req.user.name,
      currentPrice: auction.currentPrice,
      totalBids: auction.totalBids,
      newLeader: nextHighestBid ? {
        name: nextHighestBid.bidder?.name || 'Anonymous',
        amount: nextHighestBid.amount
      } : null
    });
    
    // 2. Notify live auction participants
    global.socketService.emitLiveAuctionUpdate(auction._id, {
      eventType: 'bid-retracted',
      retractedBidAmount: bid.amount,
      currentPrice: auction.currentPrice,
      totalBids: auction.totalBids,
      priceDropped: bid.amount - auction.currentPrice
    });
    
    // 3. Notify seller of bid retraction
    global.socketService.emitToUser(auction.seller.toString(), 'bid-retracted-notification', {
      auctionId: auction._id,
      auctionTitle: auction.title,
      retractedAmount: bid.amount,
      retractedBy: req.user.name,
      currentPrice: auction.currentPrice,
      reason: bid.retractionReason
    });
    
    // 4. If there's a new highest bidder, notify them
    if (nextHighestBid) {
      global.socketService.emitToUser(nextHighestBid.bidder.toString(), 'now-highest-bidder', {
        auctionId: auction._id,
        auctionTitle: auction.title,
        yourBidAmount: nextHighestBid.amount,
        previousBidRetracted: bid.amount
      });
    }
  } else {
    console.warn('⚠️ Global socket service not available for retraction updates');
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
