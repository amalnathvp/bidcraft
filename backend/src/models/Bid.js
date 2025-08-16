const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  auction: {
    type: mongoose.Schema.ObjectId,
    ref: 'Auction',
    required: [true, 'Auction is required']
  },
  bidder: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Bidder is required']
  },
  amount: {
    type: Number,
    required: [true, 'Bid amount is required'],
    min: [0.01, 'Bid amount must be at least $0.01']
  },
  maxBid: {
    type: Number,
    default: null // For automatic bidding
  },
  bidType: {
    type: String,
    enum: ['manual', 'automatic', 'buy_now'],
    default: 'manual'
  },
  status: {
    type: String,
    enum: ['active', 'outbid', 'winning', 'won', 'lost'],
    default: 'active'
  },
  isWinning: {
    type: Boolean,
    default: false
  },
  bidTime: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: String,
  
  // For automatic bidding
  isProxyBid: {
    type: Boolean,
    default: false
  },
  originalBid: {
    type: mongoose.Schema.ObjectId,
    ref: 'Bid',
    default: null
  },
  
  // Validation and fraud prevention
  isValid: {
    type: Boolean,
    default: true
  },
  validationNotes: String,
  
  // Retraction (if allowed)
  isRetracted: {
    type: Boolean,
    default: false
  },
  retractionReason: String,
  retractedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for bid increment from previous bid
bidSchema.virtual('increment').get(function() {
  // This would need to be calculated during bid creation
  return this.amount - (this.previousBidAmount || 0);
});

// Pre-save middleware for validation
bidSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Get the auction to validate bid
    const auction = await this.model('Auction').findById(this.auction);
    
    if (!auction) {
      return next(new Error('Auction not found'));
    }
    
    // Check if auction is active
    if (auction.status !== 'active') {
      return next(new Error('Auction is not active'));
    }
    
    // Check if auction has ended
    if (auction.endTime <= new Date()) {
      return next(new Error('Auction has ended'));
    }
    
    // Check if bidder is not the seller
    if (auction.seller.toString() === this.bidder.toString()) {
      return next(new Error('Seller cannot bid on their own auction'));
    }
    
    // Validate bid amount
    const minimumBid = auction.currentPrice + (auction.currentPrice * 0.05); // 5% increment
    if (this.amount < minimumBid && this.bidType !== 'buy_now') {
      return next(new Error(`Bid must be at least $${minimumBid.toFixed(2)}`));
    }
    
    // Check for buy now
    if (this.bidType === 'buy_now' && auction.buyNowPrice) {
      if (this.amount !== auction.buyNowPrice) {
        return next(new Error('Buy now amount must match the buy now price'));
      }
    }
  }
  
  next();
});

// Post-save middleware to update auction
bidSchema.post('save', async function(doc) {
  try {
    const auction = await this.model('Auction').findById(doc.auction);
    
    if (auction) {
      // Update current price and highest bid
      auction.currentPrice = doc.amount;
      auction.highestBid = doc._id;
      auction.totalBids += 1;
      
      // Check for auto-extension
      if (auction.autoExtend.enabled) {
        const timeRemaining = auction.endTime - new Date();
        if (timeRemaining <= auction.autoExtend.timeThreshold) {
          auction.endTime = new Date(auction.endTime.getTime() + auction.autoExtend.extensionTime);
        }
      }
      
      // Mark previous bids as outbid
      await this.model('Bid').updateMany(
        { 
          auction: doc.auction, 
          _id: { $ne: doc._id },
          status: { $in: ['active', 'winning'] }
        },
        { 
          status: 'outbid',
          isWinning: false
        }
      );
      
      // Mark this bid as winning
      doc.status = 'winning';
      doc.isWinning = true;
      await doc.save();
      
      await auction.save();
      
      // Emit socket event for real-time updates
      const io = require('../../server').io;
      if (io) {
        io.to(`auction-${doc.auction}`).emit('bid-update', {
          auctionId: doc.auction,
          newBid: {
            amount: doc.amount,
            bidder: doc.bidder,
            bidTime: doc.bidTime
          },
          currentPrice: auction.currentPrice,
          totalBids: auction.totalBids,
          timeRemaining: auction.endTime - new Date()
        });
      }
    }
  } catch (error) {
    console.error('Error updating auction after bid:', error);
  }
});

// Compound indexes for better performance
bidSchema.index({ auction: 1, amount: -1 });
bidSchema.index({ bidder: 1, bidTime: -1 });
bidSchema.index({ auction: 1, bidTime: -1 });
bidSchema.index({ auction: 1, isWinning: 1 });
bidSchema.index({ status: 1 });

module.exports = mongoose.model('Bid', bidSchema);
