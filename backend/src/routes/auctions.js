const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { body } = require('express-validator');
const auctionController = require('../controllers/auctionController');
const { protect, authorize, optionalAuth, checkOwnership } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const Auction = require('../models/Auction');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPEG, PNG, and WebP images are allowed.', 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5 // Maximum 5 files per upload
  }
});

// Validation rules
const createAuctionValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .custom((value) => {
      // Allow both ObjectId and string category names
      if (typeof value === 'string' && value.length > 0) {
        return true;
      }
      // Check if it's a valid ObjectId
      return /^[0-9a-fA-F]{24}$/.test(value);
    })
    .withMessage('Valid category ID or category name is required'),
  body('startingPrice')
    .isFloat({ min: 0.01 })
    .withMessage('Starting price must be at least $0.01'),
  body('startTime')
    .optional()
    .isISO8601()
    .withMessage('Valid start time is required when provided'),
  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('Valid end time is required when provided'),
  body('duration')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Duration must be between 1 and 30 days'),
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
  upload.array('images', 5),
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
