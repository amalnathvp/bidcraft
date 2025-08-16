const express = require('express');
const { body } = require('express-validator');
const bidController = require('../controllers/bidController');
const { protect, checkAuctionActive, preventSellerBidding } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const placeBidValidation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Bid amount must be at least $0.01'),
  body('maxBid')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Maximum bid must be at least $0.01'),
  body('bidType')
    .optional()
    .isIn(['manual', 'automatic', 'buy_now'])
    .withMessage('Valid bid type is required')
];

// Routes
router.get('/auction/:auctionId', bidController.getAuctionBids);
router.get('/user/my-bids', protect, bidController.getMyBids);
router.get('/:id', protect, bidController.getBid);

// Place bid (protected route with multiple middleware)
router.post('/:auctionId', 
  protect,
  checkAuctionActive,
  preventSellerBidding,
  placeBidValidation,
  bidController.placeBid
);

// Retract bid (if allowed)
router.patch('/:id/retract', protect, bidController.retractBid);

// Admin routes
router.get('/', protect, bidController.getAllBids);
router.patch('/:id/validate', protect, bidController.validateBid);

module.exports = router;
