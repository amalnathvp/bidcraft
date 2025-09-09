const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  confirmDelivery,
  initiateDispute,
  addOrderMessage,
  getAllOrders,
  markDelivered,
  cancelOrder,
  updateDispute,
  getOrderMessages
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');

// Create order
router.post('/', 
  protect,
  [
    body('auctionId').notEmpty().withMessage('Auction ID is required'),
    body('shippingAddress').optional().isObject(),
    body('paymentMethod').optional().isString()
  ],
  createOrder
);

// Get user orders
router.get('/',
  protect,
  getMyOrders
);

// Get order details
router.get('/:orderId',
  protect,
  getOrder
);

// Update order status (Seller/Admin only)
router.put('/:orderId/status',
  protect,
  [
    body('status').isIn(['processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
    body('trackingInfo').optional().isObject(),
    body('estimatedDelivery').optional().isISO8601().withMessage('Invalid date format')
  ],
  updateOrderStatus
);

// Add order message
router.post('/:orderId/message',
  protect,
  [
    body('message').isLength({ min: 1, max: 500 }).withMessage('Message must be 1-500 characters')
  ],
  addOrderMessage
);

// Confirm delivery (Buyer only)
router.post('/:orderId/confirm-delivery',
  protect,
  [
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('notes').optional().isLength({ max: 500 }).withMessage('Notes too long')
  ],
  confirmDelivery
);

// Get user orders (as buyer)
router.get('/user/purchases',
  protect,
  getMyOrders
);

// Get seller orders
router.get('/user/sales',
  protect,
  getMyOrders
);

// Dispute management
router.post('/:orderId/dispute',
  protect,
  [
    body('reason').notEmpty().withMessage('Dispute reason is required'),
    body('description').notEmpty().withMessage('Dispute description is required'),
    body('evidence').optional().isArray()
  ],
  initiateDispute
);

// Dispute status updates handled by initiateDispute function

// Order messaging
router.post('/:orderId/messages',
  protect,
  [
    body('content').notEmpty().withMessage('Message content is required'),
    body('attachments').optional().isArray()
  ],
  addOrderMessage
);

// Cancel order
router.put('/:orderId/cancel',
  protect,
  [
    body('reason').optional().isString()
  ],
  cancelOrder
);

// Mark as delivered (Seller)
router.put('/:orderId/delivered',
  protect,
  [
    body('deliveryProof').optional().isString(),
    body('notes').optional().isString()
  ],
  markDelivered
);

// Update dispute (Admin)
router.put('/:orderId/dispute',
  protect,
  authorize('admin'),
  [
    body('status').isIn(['resolved', 'refunded', 'rejected']).withMessage('Invalid dispute status'),
    body('resolution').optional().isString(),
    body('adminNotes').optional().isString()
  ],
  updateDispute
);

// Get order messages
router.get('/:orderId/messages',
  protect,
  getOrderMessages
);

// Order analytics (Admin only)
router.get('/analytics/overview',
  protect,
  authorize('admin'),
  getAllOrders
);

module.exports = router;
