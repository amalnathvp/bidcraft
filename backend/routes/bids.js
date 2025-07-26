const express = require('express');
const { body, validationResult } = require('express-validator');
const Bid = require('../models/Bid');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Place a new bid
// @route   POST /api/bids
// @access  Private
router.post('/', protect, [
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Bid amount must be at least $0.01')
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

    const { productId, amount } = req.body;
    const userId = req.user._id;

    // Get product details
    const product = await Product.findById(productId)
      .populate('seller', 'firstName lastName')
      .populate('highestBidder', 'firstName lastName');

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if auction is active
    const now = new Date();
    if (product.status !== 'active' || now < product.auctionStartDate || now >= product.auctionEndDate) {
      return res.status(400).json({
        success: false,
        message: 'Auction is not currently active'
      });
    }

    // Check if user is the seller
    if (product.seller._id.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Sellers cannot bid on their own products'
      });
    }

    // Check if bid meets minimum requirements
    const minimumBid = product.currentBid + product.bidIncrement;
    if (amount < minimumBid) {
      return res.status(400).json({
        success: false,
        message: `Bid must be at least $${minimumBid.toFixed(2)}`
      });
    }

    // Check if there's a buy now price and bid meets it
    if (product.buyNowPrice && amount >= product.buyNowPrice) {
      // Handle buy now scenario
      const bidData = {
        product: productId,
        bidder: userId,
        amount: product.buyNowPrice,
        previousBid: product.currentBid,
        bidType: 'buy-now',
        isWinning: true,
        userAgent: req.get('User-Agent') || '',
        ipAddress: req.ip || req.connection.remoteAddress || ''
      };

      const bid = await Bid.create(bidData);

      // Update product
      await Product.findByIdAndUpdate(productId, {
        currentBid: product.buyNowPrice,
        highestBidder: userId,
        status: 'sold',
        soldTo: userId,
        soldAt: new Date(),
        finalPrice: product.buyNowPrice,
        $inc: { totalBids: 1 }
      });

      // Update previous bids to not winning
      await Bid.updateMany(
        { product: productId, _id: { $ne: bid._id } },
        { isWinning: false }
      );

      // Update user statistics
      await User.findByIdAndUpdate(userId, {
        $inc: { totalBids: 1, wonAuctions: 1 }
      });

      const populatedBid = await Bid.findById(bid._id)
        .populate('bidder', 'firstName lastName avatar')
        .populate('product', 'title images currentBid');

      // Emit real-time update
      req.io.to(`auction-${productId}`).emit('bid-update', {
        bid: populatedBid,
        message: 'Item sold via Buy Now!',
        auctionEnded: true
      });

      return res.status(201).json({
        success: true,
        message: 'Congratulations! You won the item with Buy Now!',
        data: populatedBid
      });
    }

    // Create regular bid
    const bidData = {
      product: productId,
      bidder: userId,
      amount,
      previousBid: product.currentBid,
      bidType: 'regular',
      isWinning: true,
      userAgent: req.get('User-Agent') || '',
      ipAddress: req.ip || req.connection.remoteAddress || ''
    };

    const bid = await Bid.create(bidData);

    // Update previous winning bid
    if (product.highestBidder) {
      await Bid.updateMany(
        { 
          product: productId, 
          bidder: product.highestBidder,
          isWinning: true 
        },
        { isWinning: false }
      );
    }

    // Update product
    await Product.findByIdAndUpdate(productId, {
      currentBid: amount,
      highestBidder: userId,
      $inc: { totalBids: 1 }
    });

    // Update user statistics
    await User.findByIdAndUpdate(userId, {
      $inc: { totalBids: 1 }
    });

    const populatedBid = await Bid.findById(bid._id)
      .populate('bidder', 'firstName lastName avatar')
      .populate('product', 'title images currentBid');

    // Emit real-time update
    req.io.to(`auction-${productId}`).emit('bid-update', {
      bid: populatedBid,
      message: 'New bid placed!'
    });

    res.status(201).json({
      success: true,
      message: 'Bid placed successfully',
      data: populatedBid
    });
  } catch (error) {
    console.error('Place bid error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while placing bid'
    });
  }
});

// @desc    Get bid history for a product
// @route   GET /api/bids/product/:productId
// @access  Public
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const bids = await Bid.find({
      product: productId,
      isActive: true
    })
    .populate('bidder', 'firstName lastName avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Bid.countDocuments({
      product: productId,
      isActive: true
    });

    res.json({
      success: true,
      data: bids,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get bid history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bid history'
    });
  }
});

// @desc    Get user's bids
// @route   GET /api/bids/my-bids
// @access  Private
router.get('/my-bids', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status; // 'winning', 'losing', 'won', 'lost'

    let filter = {
      bidder: req.user._id,
      isActive: true
    };

    // Build aggregation pipeline for complex filtering
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      {
        $lookup: {
          from: 'users',
          localField: 'productDetails.seller',
          foreignField: '_id',
          as: 'seller'
        }
      },
      { $unwind: '$seller' }
    ];

    // Apply status filter
    if (status) {
      switch (status) {
        case 'winning':
          pipeline.push({
            $match: {
              isWinning: true,
              'productDetails.status': 'active'
            }
          });
          break;
        case 'losing':
          pipeline.push({
            $match: {
              isWinning: false,
              'productDetails.status': 'active'
            }
          });
          break;
        case 'won':
          pipeline.push({
            $match: {
              isWinning: true,
              'productDetails.status': { $in: ['ended', 'sold'] }
            }
          });
          break;
        case 'lost':
          pipeline.push({
            $match: {
              isWinning: false,
              'productDetails.status': { $in: ['ended', 'sold'] }
            }
          });
          break;
      }
    }

    // Add sorting, skip, and limit
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          amount: 1,
          isWinning: 1,
          bidType: 1,
          createdAt: 1,
          product: {
            _id: '$productDetails._id',
            title: '$productDetails.title',
            images: '$productDetails.images',
            currentBid: '$productDetails.currentBid',
            status: '$productDetails.status',
            auctionEndDate: '$productDetails.auctionEndDate'
          },
          seller: {
            firstName: '$seller.firstName',
            lastName: '$seller.lastName',
            shopName: '$seller.shopName'
          }
        }
      }
    );

    const bids = await Bid.aggregate(pipeline);

    // Get total count
    const countPipeline = pipeline.slice(0, -3); // Remove sort, skip, limit, project
    countPipeline.push({ $count: 'total' });
    const countResult = await Bid.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    res.json({
      success: true,
      data: bids,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get user bids error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user bids'
    });
  }
});

// @desc    Get highest bid for a product
// @route   GET /api/bids/highest/:productId
// @access  Public
router.get('/highest/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const highestBid = await Bid.getHighestBid(productId);

    res.json({
      success: true,
      data: highestBid
    });
  } catch (error) {
    console.error('Get highest bid error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching highest bid'
    });
  }
});

// @desc    Withdraw a bid (only in specific circumstances)
// @route   DELETE /api/bids/:bidId
// @access  Private
router.delete('/:bidId', protect, async (req, res) => {
  try {
    const { bidId } = req.params;
    const { reason } = req.body;

    const bid = await Bid.findById(bidId).populate('product');

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    // Check if user owns the bid
    if (bid.bidder.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only withdraw your own bids'
      });
    }

    // Check if bid can be withdrawn (only if not winning and auction hasn't ended)
    if (bid.isWinning) {
      return res.status(400).json({
        success: false,
        message: 'Cannot withdraw winning bid'
      });
    }

    if (bid.product.status === 'ended' || bid.product.status === 'sold') {
      return res.status(400).json({
        success: false,
        message: 'Cannot withdraw bid after auction has ended'
      });
    }

    // Soft delete the bid
    bid.isActive = false;
    bid.withdrawnAt = new Date();
    bid.withdrawalReason = reason || 'User withdrawal';
    await bid.save();

    res.json({
      success: true,
      message: 'Bid withdrawn successfully'
    });
  } catch (error) {
    console.error('Withdraw bid error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while withdrawing bid'
    });
  }
});

module.exports = router;