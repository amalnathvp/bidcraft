const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  confirmPayment,
  createPayPalPayment,
  executePayPalPayment,
  releaseEscrow,
  requestRefund,
  processRefund,
  getPaymentDetails,
  getUserPayments,
  getPaymentAnalytics
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');

// Payment intent creation
router.post('/create-intent',
  protect,
  [
    body('auctionId').notEmpty().withMessage('Auction ID is required'),
    body('paymentMethod').notEmpty().withMessage('Payment method is required')
  ],
  createPaymentIntent
);

// Confirm Stripe payment
router.post('/confirm',
  protect,
  [
    body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
    body('orderId').notEmpty().withMessage('Order ID is required')
  ],
  confirmPayment
);

// PayPal payment creation
router.post('/paypal/create',
  protect,
  [
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('amount').isNumeric().withMessage('Valid amount is required')
  ],
  createPayPalPayment
);

// PayPal payment execution
router.post('/paypal/execute',
  protect,
  [
    body('paymentId').notEmpty().withMessage('PayPal payment ID is required'),
    body('payerId').notEmpty().withMessage('Payer ID is required')
  ],
  executePayPalPayment
);

// Escrow management
router.post('/escrow/release',
  protect,
  [
    body('paymentId').notEmpty().withMessage('Payment ID is required')
  ],
  releaseEscrow
);

// Refund requests
router.post('/refund/request',
  protect,
  [
    body('paymentId').notEmpty().withMessage('Payment ID is required'),
    body('reason').notEmpty().withMessage('Refund reason is required'),
    body('amount').optional().isNumeric().withMessage('Valid amount required')
  ],
  requestRefund
);

// Process refund (Admin only)
router.post('/refund/process/:refundId',
  protect,
  authorize('admin'),
  [
    body('approved').isBoolean().withMessage('Approval status required'),
    body('adminNotes').optional().isLength({ max: 500 }).withMessage('Admin notes too long')
  ],
  processRefund
);

// Get payment details
router.get('/:paymentId',
  protect,
  getPaymentDetails
);

// Get user payments
router.get('/user/history',
  protect,
  getUserPayments
);

// Payment analytics (Admin only)
router.get('/analytics/overview',
  protect,
  authorize('admin'),
  getPaymentAnalytics
);

module.exports = router;
