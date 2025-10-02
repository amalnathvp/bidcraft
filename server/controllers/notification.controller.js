import Notification from '../models/notification.js';

// Get all notifications for a user (seller)
export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;

        const notifications = await Notification.find({
            recipient: userId,
            isDeleted: false
        })
        .populate('auction', 'itemName itemPhotos')
        .populate('bidder', 'name firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

        const totalNotifications = await Notification.countDocuments({
            recipient: userId,
            isDeleted: false
        });

        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            isDeleted: false,
            isRead: false
        });

        res.status(200).json({
            notifications,
            totalPages: Math.ceil(totalNotifications / limit),
            currentPage: page,
            totalNotifications,
            unreadCount
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, recipient: userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.status(200).json({ message: 'Notification marked as read', notification });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await Notification.updateMany(
            { recipient: userId, isDeleted: false },
            { isRead: true }
        );

        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete notification
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, recipient: userId },
            { isDeleted: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.status(200).json({ message: 'Notification deleted' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            isDeleted: false,
            isRead: false
        });

        res.status(200).json({ unreadCount });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create notification (helper function)
export const createNotification = async (notificationData) => {
    try {
        const notification = new Notification(notificationData);
        await notification.save();
        return notification;
    } catch (error) {
        console.error('Create notification error:', error);
        throw error;
    }
};

// Contact seller - creates a notification for the seller
export const contactSeller = async (req, res) => {
    try {
        const { sellerId, auctionId, subject, message, buyerName, buyerEmail } = req.body;
        const userId = req.user?.id;

        if (!sellerId || !message || !subject) {
            return res.status(400).json({ 
                message: 'Missing required fields: sellerId, subject, and message are required' 
            });
        }

        // Prevent users from contacting themselves
        if (userId === sellerId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot send a message to yourself'
            });
        }

        // Create notification for the seller
        const notificationData = {
            recipient: sellerId,
            type: 'new_bid', // Using existing enum value temporarily
            title: `New message: ${subject}`,
            message: `${buyerName || 'A user'} sent you a message: "${message}"`,
            auction: auctionId || null,
            metadata: {
                isContactMessage: true, // Flag to identify this as a contact message
                senderId: userId,
                senderName: buyerName,
                senderEmail: buyerEmail,
                subject: subject,
                originalMessage: message,
                contactedAt: new Date()
            }
        };

        const notification = await createNotification(notificationData);

        res.status(200).json({
            success: true,
            message: 'Message sent to seller successfully',
            notificationId: notification._id
        });

    } catch (error) {
        console.error('Contact seller error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to send message to seller', 
            error: error.message 
        });
    }
};