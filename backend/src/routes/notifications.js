const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  updatePreferences,
  getPreferences
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');

// All routes require authentication
router.use(protect);

// Get notifications
router.get('/', getNotifications);

// Get notification preferences
router.get('/preferences', getPreferences);

// Update notification preferences
router.put('/preferences', 
  [
    body('email').optional().isObject(),
    body('push').optional().isObject(),
    body('sms').optional().isObject()
  ],
  updatePreferences
);

// Mark all notifications as read
router.put('/read-all', markAllAsRead);

// Mark specific notification as read
router.put('/:notificationId/read', markAsRead);

// Delete notification
router.delete('/:notificationId', deleteNotification);

module.exports = router;
