const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Order identification
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  // Related entities
  buyer: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Buyer is required']
  },
  seller: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Seller is required']
  },
  auction: {
    type: mongoose.Schema.ObjectId,
    ref: 'Auction',
    required: [true, 'Auction is required']
  },
  payment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Payment'
  },
  
  // Order details
  item: {
    title: {
      type: String,
      required: true
    },
    description: String,
    images: [String],
    category: String,
    condition: String
  },
  
  // Pricing
  itemPrice: {
    type: Number,
    required: [true, 'Item price is required']
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  platformFee: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required']
  },
  
  // Shipping information
  shipping: {
    method: {
      type: String,
      enum: ['standard', 'express', 'overnight', 'pickup'],
      default: 'standard'
    },
    address: {
      firstName: String,
      lastName: String,
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      phone: String
    },
    trackingNumber: String,
    carrier: String,
    estimatedDelivery: Date,
    actualDelivery: Date
  },
  
  // Order status
  status: {
    type: String,
    enum: [
      'pending_payment',
      'payment_confirmed', 
      'processing',
      'shipped',
      'in_transit',
      'delivered',
      'completed',
      'cancelled',
      'refunded',
      'disputed'
    ],
    default: 'pending_payment'
  },
  
  // Important dates
  orderDate: {
    type: Date,
    default: Date.now
  },
  shippedDate: Date,
  deliveredDate: Date,
  completedDate: Date,
  
  // Communication
  messages: [{
    sender: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    }
  }],
  
  // Dispute management
  dispute: {
    isDisputed: {
      type: Boolean,
      default: false
    },
    reason: String,
    initiatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    initiatedAt: Date,
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved', 'closed']
    },
    resolution: String,
    resolvedAt: Date
  },
  
  // Delivery confirmation
  deliveryConfirmation: {
    confirmed: {
      type: Boolean,
      default: false
    },
    confirmedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    confirmedAt: Date,
    photos: [String], // Delivery photos
    signature: String, // Digital signature if applicable
    notes: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for order age
orderSchema.virtual('orderAge').get(function() {
  return Math.floor((Date.now() - this.orderDate) / (1000 * 60 * 60 * 24));
});

// Virtual for shipping status
orderSchema.virtual('shippingStatus').get(function() {
  if (this.deliveredDate) return 'delivered';
  if (this.shippedDate) return 'shipped';
  if (this.status === 'processing') return 'preparing';
  return 'pending';
});

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `BC${Date.now()}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Method to calculate delivery estimate
orderSchema.methods.calculateDeliveryEstimate = function() {
  const now = new Date();
  let estimatedDays = 3; // Default
  
  switch (this.shipping.method) {
    case 'overnight':
      estimatedDays = 1;
      break;
    case 'express':
      estimatedDays = 2;
      break;
    case 'standard':
      estimatedDays = 5;
      break;
    case 'pickup':
      estimatedDays = 0;
      break;
  }
  
  this.shipping.estimatedDelivery = new Date(now.getTime() + (estimatedDays * 24 * 60 * 60 * 1000));
  return this.shipping.estimatedDelivery;
};

// Method to confirm delivery
orderSchema.methods.confirmDelivery = async function(confirmedBy, photos = [], notes = '') {
  this.deliveryConfirmation.confirmed = true;
  this.deliveryConfirmation.confirmedBy = confirmedBy;
  this.deliveryConfirmation.confirmedAt = new Date();
  this.deliveryConfirmation.photos = photos;
  this.deliveryConfirmation.notes = notes;
  
  this.status = 'delivered';
  this.deliveredDate = new Date();
  
  await this.save();
  return this;
};

// Indexes
orderSchema.index({ buyer: 1, status: 1 });
orderSchema.index({ seller: 1, status: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'dispute.isDisputed': 1 });

module.exports = mongoose.model('Order', orderSchema);
