import axios from "axios";

const VITE_API = import.meta.env.VITE_API;

// Get all notifications for buyer
export const getBuyerNotifications = async (page = 1, limit = 20) => {
    try {
        const res = await axios.get(`${VITE_API}/buyer/notifications`, {
            params: { page, limit },
            withCredentials: true
        });
        return res.data;
    } catch (error) {
        console.error("Error fetching buyer notifications:", error?.response?.data?.error || error.message);
        throw error;
    }
};

// Get unread notification count for buyer
export const getBuyerUnreadCount = async () => {
    try {
        const res = await axios.get(`${VITE_API}/buyer/notifications/unread-count`, {
            withCredentials: true
        });
        return res.data;
    } catch (error) {
        console.error("Error fetching unread count:", error?.response?.data?.error || error.message);
        throw error;
    }
};

// Mark specific notification as read
export const markBuyerNotificationAsRead = async (notificationId) => {
    try {
        const res = await axios.patch(`${VITE_API}/buyer/notifications/${notificationId}/read`, {}, {
            withCredentials: true
        });
        return res.data;
    } catch (error) {
        console.error("Error marking notification as read:", error?.response?.data?.error || error.message);
        throw error;
    }
};

// Mark all notifications as read
export const markAllBuyerNotificationsAsRead = async () => {
    try {
        const res = await axios.patch(`${VITE_API}/buyer/notifications/mark-all-read`, {}, {
            withCredentials: true
        });
        return res.data;
    } catch (error) {
        console.error("Error marking all notifications as read:", error?.response?.data?.error || error.message);
        throw error;
    }
};

// Delete notification (soft delete)
export const deleteBuyerNotification = async (notificationId) => {
    try {
        const res = await axios.delete(`${VITE_API}/buyer/notifications/${notificationId}`, {
            withCredentials: true
        });
        return res.data;
    } catch (error) {
        console.error("Error deleting notification:", error?.response?.data?.error || error.message);
        throw error;
    }
};