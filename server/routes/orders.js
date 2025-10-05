import express from 'express';
import { secureRoute } from '../middleware/auth.js';
import { authenticateBuyer, authenticateSeller } from '../middleware/roleAuth.js';
import {
  createOrder,
  getBuyerOrders,
  getSellerOrders,
  getOrderDetails,
  updateOrderStatus
} from '../controllers/order.controller.js';

const router = express.Router();

// Create new order (after successful payment)
router.post('/', authenticateBuyer, createOrder);

// Get orders for buyer (using buyer-specific auth)
router.get('/buyer', authenticateBuyer, getBuyerOrders);

// Get orders for seller (using seller-specific auth)
router.get('/seller', authenticateSeller, getSellerOrders);

// Get single order details
router.get('/:orderId', secureRoute, getOrderDetails);

// Update order status (sellers only)
router.put('/:orderId/status', authenticateSeller, updateOrderStatus);

export default router;