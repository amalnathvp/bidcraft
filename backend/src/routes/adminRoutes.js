const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUserAnalytics,
  getRevenueAnalytics
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// Apply authentication and admin-only middleware to all routes
router.use(protect);
router.use(adminOnly);

// Dashboard statistics
router.get('/dashboard/stats', getDashboardStats);

// Analytics routes
router.get('/analytics/users', getUserAnalytics);
router.get('/analytics/revenue', getRevenueAnalytics);

module.exports = router;