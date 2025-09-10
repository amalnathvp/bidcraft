const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('🔐 Auth middleware: Token extracted from Authorization header');
      console.log('📝 Full Authorization header:', req.headers.authorization);
      console.log('🔑 Extracted token length:', token ? token.length : 0);
      console.log('🔑 Token preview:', token ? token.substring(0, 30) + '...' : 'null');
      
      // Check if token contains any unexpected characters
      if (token && !/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(token)) {
        console.log('⚠️ Token format looks suspicious - not standard JWT format');
        console.log('🔍 Token character analysis:', {
          hasSpaces: token.includes(' '),
          hasNewlines: token.includes('\n'),
          hasCarriageReturn: token.includes('\r'),
          startsWithBearer: token.startsWith('Bearer'),
          actualLength: token.length
        });
      }
    } else {
      console.log('❌ No Authorization header or invalid format');
      console.log('📝 Available headers:', Object.keys(req.headers));
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      console.log('🔐 Auth middleware: Verifying token...');
      console.log('🔑 Token preview:', token.substring(0, 20) + '...');
      console.log('🔒 JWT_SECRET exists:', !!process.env.JWT_SECRET);
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token verification successful, user ID:', decoded.id);
      
      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      console.log('👤 User lookup result:', user ? 'Found' : 'Not found');
      
      if (!user) {
        console.log('❌ User not found for ID:', decoded.id);
        return res.status(401).json({
          success: false,
          message: 'Token is not valid. User not found.'
        });
      }

      console.log('👤 User found:', user.name, 'Role:', user.role, 'Active:', user.isActive);

      if (!user.isActive) {
        console.log('❌ User account is inactive');
        return res.status(401).json({
          success: false,
          message: 'Account has been deactivated.'
        });
      }

      req.user = user;
      console.log('✅ Auth middleware: User authenticated successfully');
      next();
    } catch (error) {
      console.log('❌ JWT verification error:', error.message);
      console.log('❌ Error type:', error.name);
      return res.status(401).json({
        success: false,
        message: 'Token is not valid.'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${req.user.role} role is not authorized to access this route`
      });
    }

    next();
  };
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Silent fail for optional auth
        console.log('Optional auth failed:', error.message);
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

// Check if user owns the resource
const checkOwnership = (model, userField = 'user') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const resource = await model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Check if user owns the resource or is admin
      if (resource[userField].toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this resource'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error in ownership check'
      });
    }
  };
};

// Verify email middleware
const requireEmailVerification = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required. Please check your email and verify your account.'
    });
  }
  next();
};

// Check if user can perform action based on their status
const checkUserStatus = (req, res, next) => {
  if (!req.user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Account is inactive. Please contact support.'
    });
  }
  next();
};

// Middleware to check if auction is still active for bidding
const checkAuctionActive = async (req, res, next) => {
  try {
    const Auction = require('../models/Auction');
    const auction = await Auction.findById(req.params.auctionId || req.body.auctionId);

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    if (auction.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Auction is not active'
      });
    }

    if (auction.endTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Auction has ended'
      });
    }

    req.auction = auction;
    next();
  } catch (error) {
    console.error('Auction status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking auction status'
    });
  }
};

// Middleware to prevent seller from bidding on own auction
const preventSellerBidding = (req, res, next) => {
  if (req.auction && req.auction.seller.toString() === req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Sellers cannot bid on their own auctions'
    });
  }
  next();
};

// Admin only access
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }

  next();
};

module.exports = {
  protect,
  authorize,
  adminOnly,
  optionalAuth,
  checkOwnership,
  requireEmailVerification,
  checkUserStatus,
  checkAuctionActive,
  preventSellerBidding
};
