const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required']
  },
  bidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Bidder reference is required']
  },
  amount: {
    type: Number,
    required: [true, 'Bid amount is required'],
    min: [0.01, 'Bid amount must be at least $0.01']
  },
  previousBid: {
    type: Number,
    default: 0
  },
  isWinning: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  bidType: {
    type: String,
    enum: ['regular', 'auto', 'buy-now'],
    default: 'regular'
  },
  userAgent: {
    type: String,
    default: ''
  },
  ipAddress: {
    type: String,
    default: ''
  },
  withdrawnAt: Date,
  withdrawalReason: String
}, {
  timestamps: true
});

// Compound indexes for better query performance
bidSchema.index({ product: 1, amount: -1 });
bidSchema.index({ bidder: 1, createdAt: -1 });
bidSchema.index({ product: 1, createdAt: -1 });
bidSchema.index({ product: 1, isWinning: 1 });

// Virtual for bid increment from previous bid
bidSchema.virtual('increment').get(function() {
  return this.amount - this.previousBid;
});

// Ensure virtual fields are serialized
bidSchema.set('toJSON', {
  virtuals: true
});

// Static method to get highest bid for a product
bidSchema.statics.getHighestBid = async function(productId) {
  const highestBid = await this.findOne({
    product: productId,
    isActive: true
  })
  .sort({ amount: -1 })
  .populate('bidder', 'firstName lastName email avatar');
  
  return highestBid;
};

// Static method to get bid history for a product
bidSchema.statics.getBidHistory = async function(productId, limit = 10) {
  const bidHistory = await this.find({
    product: productId,
    isActive: true
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('bidder', 'firstName lastName email avatar');
  
  return bidHistory;
};

// Static method to get user's bids for a product
bidSchema.statics.getUserBidsForProduct = async function(productId, userId) {
  const userBids = await this.find({
    product: productId,
    bidder: userId,
    isActive: true
  })
  .sort({ createdAt: -1 });
  
  return userBids;
};

module.exports = mongoose.model('Bid', bidSchema);