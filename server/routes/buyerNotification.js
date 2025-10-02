import express from 'express';
import { 
    getNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    getUnreadCount 
} from '../controllers/notification.controller.js';
import { authenticateBuyer } from '../middleware/roleAuth.js';

const router = express.Router();

// All routes use buyer authentication
router.use(authenticateBuyer);

// Get all notifications for buyer
router.get('/', getNotifications);

// Get unread count for buyer
router.get('/unread-count', getUnreadCount);

// Mark specific notification as read
router.patch('/:id/read', markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', markAllAsRead);

// Delete notification (soft delete)
router.delete('/:id', deleteNotification);

export default router;