const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/sellers', userController.getTopSellers);
router.get('/:id/profile', userController.getUserProfile);

// Protected routes
router.get('/me/dashboard', protect, userController.getDashboard);
router.get('/me/notifications', protect, userController.getNotifications);
router.patch('/me/notifications', protect, userController.updateNotificationSettings);
router.get('/me/watchlist', protect, userController.getWatchlist);
router.get('/me/purchase-history', protect, userController.getPurchaseHistory);
router.get('/me/selling-history', protect, authorize('seller', 'admin'), userController.getSellingHistory);

// Admin routes
router.get('/', protect, authorize('admin'), userController.getAllUsers);
router.patch('/:id/status', protect, authorize('admin'), userController.updateUserStatus);
router.get('/analytics', protect, authorize('admin'), userController.getUserAnalytics);

module.exports = router;
