const express = require('express');
const router = express.Router();
const {
  getFeaturedItems,
  getTrendingItems,
  getEndingSoonItems,
  getHotItems,
  getRecentItems,
  searchItems,
  getItemRecommendations,
  getItemsBySeller
} = require('../controllers/itemController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/featured', getFeaturedItems);
router.get('/trending', getTrendingItems);
router.get('/ending-soon', getEndingSoonItems);
router.get('/hot', getHotItems);
router.get('/recent', getRecentItems);
router.get('/search', searchItems);
router.get('/seller/:sellerId', getItemsBySeller);
router.get('/:itemId/recommendations', getItemRecommendations);

module.exports = router;
