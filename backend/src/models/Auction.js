const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Auction title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  subcategory: {
    type: String,
    trim: true
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: String,
    alt: String
  }],
  
  // Pricing
  startingPrice: {
    type: Number,
    required: [true, 'Starting price is required'],
    min: [0.01, 'Starting price must be at least $0.01']
  },
  currentPrice: {
    type: Number,
    default: function() {
      return this.startingPrice;
    }
  },
  reservePrice: {
    type: Number,
    default: 0
  },
  buyNowPrice: {
    type: Number,
    default: null
  },
  
  // Timing
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  duration: {
    type: Number, // in milliseconds
    required: true
  },
  
  // Seller information
  seller: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Item details
  condition: {
    type: String,
    enum: ['new', 'like-new', 'good', 'fair', 'poor'],
    required: true
  },
  materials: [{
    type: String,
    trim: true
  }],
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    weight: Number,
    unit: {
      type: String,
      enum: ['cm', 'inches'],
      default: 'cm'
    }
  },
  origin: {
    country: String,
    region: String,
    artisan: String
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  
  // Auction status
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'ended', 'cancelled', 'sold'],
    default: 'draft'
  },
  
  // Bidding information
  totalBids: {
    type: Number,
    default: 0
  },
  highestBid: {
    type: mongoose.Schema.ObjectId,
    ref: 'Bid',
    default: null
  },
  winner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Engagement metrics
  views: {
    type: Number,
    default: 0
  },
  watchers: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  questions: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    question: String,
    answer: String,
    askedAt: {
      type: Date,
      default: Date.now
    },
    answeredAt: Date
  }],
  
  // Shipping information
  shipping: {
    method: {
      type: String,
      enum: ['standard', 'express', 'overnight', 'pickup'],
      default: 'standard'
    },
    cost: {
      type: Number,
      default: 0
    },
    freeShipping: {
      type: Boolean,
      default: false
    },
    international: {
      type: Boolean,
      default: false
    },
    handlingTime: {
      type: Number, // in days
      default: 1
    }
  },
  
  // Payment information
  paymentMethods: [{
    type: String,
    enum: ['credit_card', 'paypal', 'bank_transfer', 'crypto']
  }],
  
  // Administrative
  featured: {
    type: Boolean,
    default: false
  },
  reported: {
    count: {
      type: Number,
      default: 0
    },
    reasons: [String]
  },
  adminNotes: String,
  
  // Auto-extension
  autoExtend: {
    enabled: {
      type: Boolean,
      default: false
    },
    timeThreshold: {
      type: Number,
      default: 300000 // 5 minutes in milliseconds
    },
    extensionTime: {
      type: Number,
      default: 600000 // 10 minutes in milliseconds
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for auction bids
auctionSchema.virtual('bids', {
  ref: 'Bid',
  localField: '_id',
  foreignField: 'auction',
  justOne: false,
  options: { sort: { amount: -1 } }
});

// Virtual for time remaining
auctionSchema.virtual('timeRemaining').get(function() {
  if (this.status !== 'active') return 0;
  const now = new Date();
  const remaining = this.endTime - now;
  return Math.max(0, remaining);
});

// Virtual for is ending soon
auctionSchema.virtual('isEndingSoon').get(function() {
  const timeRemaining = this.timeRemaining;
  return timeRemaining > 0 && timeRemaining <= 3600000; // 1 hour
});

// Virtual for reserve met
auctionSchema.virtual('reserveMet').get(function() {
  return this.currentPrice >= this.reservePrice;
});

// Pre-save middleware
auctionSchema.pre('save', function(next) {
  // Calculate duration if not set
  if (!this.duration && this.startTime && this.endTime) {
    this.duration = this.endTime - this.startTime;
  }
  
  // Set status based on timing
  const now = new Date();
  if (this.startTime > now) {
    this.status = 'scheduled';
  } else if (this.endTime > now && this.status === 'scheduled') {
    this.status = 'active';
  } else if (this.endTime <= now && this.status === 'active') {
    this.status = 'ended';
  }
  
  next();
});

// Pre-remove middleware to clean up related data
auctionSchema.pre('remove', async function(next) {
  // Remove all bids for this auction
  await this.model('Bid').deleteMany({ auction: this._id });
  next();
});

// Indexes for better performance
auctionSchema.index({ status: 1, endTime: 1 });
auctionSchema.index({ category: 1, status: 1 });
auctionSchema.index({ seller: 1, status: 1 });
auctionSchema.index({ endTime: 1 });
auctionSchema.index({ startTime: 1 });
auctionSchema.index({ featured: 1, status: 1 });
auctionSchema.index({ tags: 1 });
auctionSchema.index({ 'title': 'text', 'description': 'text', 'tags': 'text' });

module.exports = mongoose.model('Auction', auctionSchema);
