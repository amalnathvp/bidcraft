const express = require('express');
const router = express.Router();
const {
  getOverviewAnalytics,
  getUserActivityAnalytics,
  getSellerPerformanceAnalytics,
  getAuctionPerformanceAnalytics,
  getFinancialAnalytics,
  getMyAnalytics
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

// User analytics (accessible by the user themselves)
router.get('/my-stats', protect, getMyAnalytics);

// Admin analytics (admin only)
router.get('/overview', protect, authorize('admin'), getOverviewAnalytics);
router.get('/user-activity', protect, authorize('admin'), getUserActivityAnalytics);
router.get('/seller-performance', protect, authorize('admin'), getSellerPerformanceAnalytics);
router.get('/auction-performance', protect, authorize('admin'), getAuctionPerformanceAnalytics);
router.get('/financial', protect, authorize('admin'), getFinancialAnalytics);

module.exports = router;
