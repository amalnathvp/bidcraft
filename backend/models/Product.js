const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'pottery',
      'jewelry',
      'textiles',
      'woodwork',
      'metalwork',
      'glasswork',
      'leatherwork',
      'painting',
      'sculpture',
      'home-decor',
      'accessories',
      'other'
    ]
  },
  subcategory: {
    type: String,
    trim: true
  },
  images: [{
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    }
  }],
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startingBid: {
    type: Number,
    required: [true, 'Starting bid is required'],
    min: [0.01, 'Starting bid must be at least $0.01']
  },
  currentBid: {
    type: Number,
    default: function() {
      return this.startingBid;
    }
  },
  bidIncrement: {
    type: Number,
    default: 1.00,
    min: [0.01, 'Bid increment must be at least $0.01']
  },
  reservePrice: {
    type: Number,
    min: 0
  },
  buyNowPrice: {
    type: Number,
    min: 0
  },
  auctionStartDate: {
    type: Date,
    required: [true, 'Auction start date is required']
  },
  auctionEndDate: {
    type: Date,
    required: [true, 'Auction end date is required'],
    validate: {
      validator: function(endDate) {
        return endDate > this.auctionStartDate;
      },
      message: 'Auction end date must be after start date'
    }
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'ended', 'sold', 'cancelled'],
    default: 'draft'
  },
  condition: {
    type: String,
    enum: ['new', 'like-new', 'good', 'fair', 'poor'],
    required: [true, 'Condition is required']
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
      enum: ['inches', 'cm', 'feet', 'meters'],
      default: 'inches'
    }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  totalBids: {
    type: Number,
    default: 0
  },
  highestBidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  watchers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  shippingInfo: {
    freeShipping: {
      type: Boolean,
      default: false
    },
    shippingCost: {
      type: Number,
      default: 0
    },
    estimatedDelivery: {
      type: String,
      default: '5-7 business days'
    },
    shippingMethods: [{
      type: String,
      enum: ['standard', 'express', 'overnight', 'pickup']
    }]
  },
  soldTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  soldAt: Date,
  finalPrice: Number,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
productSchema.index({ category: 1, status: 1 });
productSchema.index({ seller: 1, status: 1 });
productSchema.index({ auctionEndDate: 1, status: 1 });
productSchema.index({ featured: 1, status: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Virtual for time remaining
productSchema.virtual('timeRemaining').get(function() {
  if (this.status === 'active') {
    const now = new Date();
    const timeLeft = this.auctionEndDate - now;
    return Math.max(0, timeLeft);
  }
  return 0;
});

// Virtual for auction status
productSchema.virtual('auctionStatus').get(function() {
  const now = new Date();
  
  if (this.status === 'cancelled' || this.status === 'sold') {
    return this.status;
  }
  
  if (now < this.auctionStartDate) {
    return 'scheduled';
  } else if (now >= this.auctionStartDate && now < this.auctionEndDate) {
    return 'active';
  } else {
    return 'ended';
  }
});

// Middleware to update status based on dates
productSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.status === 'draft' || this.status === 'scheduled') {
    if (now >= this.auctionStartDate && now < this.auctionEndDate) {
      this.status = 'active';
    } else if (now >= this.auctionEndDate) {
      this.status = 'ended';
    }
  }
  
  next();
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Product', productSchema);