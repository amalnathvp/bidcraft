const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['buyer', 'seller', 'admin'],
    default: 'buyer'
  },
  avatar: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  // Seller specific fields
  shopName: {
    type: String,
    trim: true
  },
  shopDescription: {
    type: String,
    trim: true
  },
  bankDetails: {
    accountNumber: String,
    bankName: String,
    routingNumber: String,
    accountHolderName: String
  },
  sellerRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalSales: {
    type: Number,
    default: 0
  },
  
  // Buyer specific fields
  watchlist: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Auction'
  }],
  savedSearches: [{
    query: String,
    filters: mongoose.Schema.Types.Mixed,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Activity tracking
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  notifications: {
    email: {
      newBids: { type: Boolean, default: true },
      auctionUpdates: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false }
    },
    push: {
      newBids: { type: Boolean, default: true },
      auctionUpdates: { type: Boolean, default: true }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for user's auctions
userSchema.virtual('auctions', {
  ref: 'Auction',
  localField: '_id',
  foreignField: 'seller',
  justOne: false
});

// Virtual for user's bids
userSchema.virtual('bids', {
  ref: 'Bid',
  localField: '_id',
  foreignField: 'bidder',
  justOne: false
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate verification token
userSchema.methods.getVerificationToken = function() {
  const crypto = require('crypto');
  const verificationToken = crypto.randomBytes(20).toString('hex');
  this.verificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  return verificationToken;
};

// Method to generate reset password token
userSchema.methods.getResetPasswordToken = function() {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
