import express from 'express';
import { 
    getNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    getUnreadCount,
    contactSeller 
} from '../controllers/notification.controller.js';
import { authenticateSeller, authenticateBuyer, authenticate } from '../middleware/roleAuth.js';

const router = express.Router();

// Get all notifications for the seller
router.get('/', authenticateSeller, getNotifications);

// Get unread count
router.get('/unread-count', authenticateSeller, getUnreadCount);

// Contact seller (any authenticated user can contact seller, but not themselves)
router.post('/contact-seller', authenticate, contactSeller);

// Mark notification as read
router.patch('/:id/read', authenticateSeller, markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', authenticateSeller, markAllAsRead);

// Delete notification
router.delete('/:id', authenticateSeller, deleteNotification);

export default router;