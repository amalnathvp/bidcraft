import express from 'express';
import { secureRoute } from '../middleware/auth.js';
import {
  createOrder,
  getBuyerOrders,
  getSellerOrders,
  getOrderDetails,
  updateOrderStatus
} from '../controllers/order.controller.js';

const router = express.Router();

// Create new order (after successful payment)
router.post('/', secureRoute, createOrder);

// Get orders for buyer
router.get('/buyer', secureRoute, getBuyerOrders);

// Get orders for seller
router.get('/seller', secureRoute, getSellerOrders);

// Get single order details
router.get('/:orderId', secureRoute, getOrderDetails);

// Update order status (sellers only)
router.put('/:orderId/status', secureRoute, updateOrderStatus);

export default router;