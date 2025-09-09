const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;
  
  const user = await User.findById(req.user._id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  // Filter notifications
  let notifications = user.notifications.inApp || [];
  
  if (req.query.unread === 'true') {
    notifications = notifications.filter(n => !n.isRead);
  }
  
  if (req.query.type) {
    notifications = notifications.filter(n => n.type === req.query.type);
  }
  
  // Sort by date (newest first)
  notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Paginate
  const paginatedNotifications = notifications.slice(startIndex, startIndex + limit);
  const total = notifications.length;
  
  res.status(200).json({
    success: true,
    count: paginatedNotifications.length,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      total
    },
    unreadCount: notifications.filter(n => !n.isRead).length,
    data: paginatedNotifications
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:notificationId/read
// @access  Private
const markAsRead = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  const notification = user.notifications.inApp.id(req.params.notificationId);
  
  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }
  
  notification.isRead = true;
  notification.readAt = new Date();
  
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    data: notification
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  const unreadNotifications = user.notifications.inApp.filter(n => !n.isRead);
  
  unreadNotifications.forEach(notification => {
    notification.isRead = true;
    notification.readAt = new Date();
  });
  
  await user.save();
  
  res.status(200).json({
    success: true,
    message: `${unreadNotifications.length} notifications marked as read`,
    data: { count: unreadNotifications.length }
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:notificationId
// @access  Private
const deleteNotification = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  const notification = user.notifications.inApp.id(req.params.notificationId);
  
  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }
  
  notification.remove();
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Notification deleted',
    data: {}
  });
});

// @desc    Update notification preferences
// @route   PUT /api/notifications/preferences
// @access  Private
const updatePreferences = asyncHandler(async (req, res, next) => {
  const {
    email: emailPrefs,
    push: pushPrefs,
    sms: smsPrefs
  } = req.body;
  
  const user = await User.findById(req.user._id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  // Update email preferences
  if (emailPrefs) {
    user.notifications.email = {
      ...user.notifications.email,
      ...emailPrefs
    };
  }
  
  // Update push preferences
  if (pushPrefs) {
    user.notifications.push = {
      ...user.notifications.push,
      ...pushPrefs
    };
  }
  
  // Update SMS preferences
  if (smsPrefs) {
    user.notifications.sms = {
      ...user.notifications.sms,
      ...smsPrefs
    };
  }
  
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Notification preferences updated',
    data: {
      email: user.notifications.email,
      push: user.notifications.push,
      sms: user.notifications.sms
    }
  });
});

// @desc    Get notification preferences
// @route   GET /api/notifications/preferences
// @access  Private
const getPreferences = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: {
      email: user.notifications.email || {},
      push: user.notifications.push || {},
      sms: user.notifications.sms || {}
    }
  });
});

// Utility function to create notification
const createNotification = async (userId, notification) => {
  try {
    const user = await User.findById(userId);
    if (!user) return false;
    
    if (!user.notifications.inApp) {
      user.notifications.inApp = [];
    }
    
    user.notifications.inApp.push({
      ...notification,
      createdAt: new Date(),
      isRead: false
    });
    
    // Keep only last 100 notifications to prevent bloat
    if (user.notifications.inApp.length > 100) {
      user.notifications.inApp = user.notifications.inApp.slice(-100);
    }
    
    await user.save();
    
    // Emit real-time notification if socket service is available
    if (global.socketService) {
      global.socketService.sendNotification(userId, notification);
    }
    
    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
};

// Notification types
const NOTIFICATION_TYPES = {
  BID_PLACED: 'bid_placed',
  BID_OUTBID: 'bid_outbid',
  AUCTION_WON: 'auction_won',
  AUCTION_ENDED: 'auction_ended',
  PAYMENT_RECEIVED: 'payment_received',
  ORDER_SHIPPED: 'order_shipped',
  ORDER_DELIVERED: 'order_delivered',
  REVIEW_RECEIVED: 'review_received',
  DISPUTE_CREATED: 'dispute_created',
  SYSTEM_UPDATE: 'system_update'
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  updatePreferences,
  getPreferences,
  createNotification,
  NOTIFICATION_TYPES
};
