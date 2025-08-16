const express = require('express');
const { body } = require('express-validator');
const auctionController = require('../controllers/auctionController');
const { protect, authorize, optionalAuth, checkOwnership } = require('../middleware/auth');
const Auction = require('../models/Auction');

const router = express.Router();

// Validation rules
const createAuctionValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),
  body('category')
    .isMongoId()
    .withMessage('Valid category ID is required'),
  body('startingPrice')
    .isFloat({ min: 0.01 })
    .withMessage('Starting price must be at least $0.01'),
  body('startTime')
    .isISO8601()
    .withMessage('Valid start time is required'),
  body('endTime')
    .isISO8601()
    .withMessage('Valid end time is required'),
  body('condition')
    .isIn(['new', 'like-new', 'good', 'fair', 'poor'])
    .withMessage('Valid condition is required')
];

const updateAuctionValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),
  body('startingPrice')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Starting price must be at least $0.01')
];

// Public routes
router.get('/', optionalAuth, auctionController.getAuctions);
router.get('/featured', auctionController.getFeaturedAuctions);
router.get('/ending-soon', auctionController.getEndingSoonAuctions);
router.get('/search', optionalAuth, auctionController.searchAuctions);
router.get('/categories/:categoryId', optionalAuth, auctionController.getAuctionsByCategory);
router.get('/:id', optionalAuth, auctionController.getAuction);

// Protected routes - Sellers only
router.post('/', 
  protect, 
  authorize('seller', 'admin'), 
  createAuctionValidation, 
  auctionController.createAuction
);

router.put('/:id', 
  protect, 
  authorize('seller', 'admin'), 
  checkOwnership(Auction, 'seller'),
  updateAuctionValidation, 
  auctionController.updateAuction
);

router.delete('/:id', 
  protect, 
  authorize('seller', 'admin'), 
  checkOwnership(Auction, 'seller'),
  auctionController.deleteAuction
);

router.patch('/:id/publish', 
  protect, 
  authorize('seller', 'admin'), 
  checkOwnership(Auction, 'seller'),
  auctionController.publishAuction
);

router.patch('/:id/cancel', 
  protect, 
  authorize('seller', 'admin'), 
  checkOwnership(Auction, 'seller'),
  auctionController.cancelAuction
);

// Seller's auction management
router.get('/seller/my-auctions', 
  protect, 
  authorize('seller', 'admin'), 
  auctionController.getMyAuctions
);

// Buyer interactions
router.post('/:id/watch', protect, auctionController.watchAuction);
router.delete('/:id/watch', protect, auctionController.unwatchAuction);
router.post('/:id/question', protect, auctionController.askQuestion);

// Seller responses
router.put('/:id/question/:questionId/answer', 
  protect, 
  authorize('seller', 'admin'), 
  checkOwnership(Auction, 'seller'),
  auctionController.answerQuestion
);

// Admin routes
router.patch('/:id/feature', 
  protect, 
  authorize('admin'), 
  auctionController.featureAuction
);

router.patch('/:id/report', protect, auctionController.reportAuction);

module.exports = router;
