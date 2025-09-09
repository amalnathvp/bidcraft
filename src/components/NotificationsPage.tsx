import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface Notification {
  _id: string;
  user: string;
  type: 'auction_won' | 'bid_placed' | 'auction_ending' | 'outbid' | 'payment_completed' | 'order_shipped' | 'review_received' | 'system';
  title: string;
  message: string;
  data?: {
    auctionId?: string;
    orderId?: string;
    paymentId?: string;
    bidAmount?: number;
    imageUrl?: string;
  };
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  readAt?: string;
}

interface NotificationPreferences {
  email: {
    bidding: boolean;
    auctions: boolean;
    orders: boolean;
    marketing: boolean;
  };
  push: {
    bidding: boolean;
    auctions: boolean;
    orders: boolean;
  };
  inApp: {
    bidding: boolean;
    auctions: boolean;
    orders: boolean;
    system: boolean;
  };
}

interface NotificationsPageProps {
  onNavigate?: (page: string, data?: any) => void;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/notifications');
      
      if (response.success) {
        setNotifications(response.data);
      } else {
        setError('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await apiService.get('/notifications/preferences');
      
      if (response.success) {
        setPreferences(response.data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await apiService.post(`/notifications/${notificationId}/read`, {});
      
      if (response.success) {
        setNotifications(notifications.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await apiService.post('/notifications/mark-all-read', {});
      
      if (response.success) {
        setNotifications(notifications.map(notification => ({
          ...notification,
          isRead: true,
          readAt: new Date().toISOString()
        })));
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await apiService.delete(`/notifications/${notificationId}`);
      
      if (response.success) {
        setNotifications(notifications.filter(n => n._id !== notificationId));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const updatePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      const response = await apiService.put('/notifications/preferences', newPreferences);
      
      if (response.success) {
        setPreferences(newPreferences);
        alert('Preferences updated successfully');
      } else {
        alert('Failed to update preferences');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      alert('Failed to update preferences');
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'auction_won': 'fas fa-trophy',
      'bid_placed': 'fas fa-hand-paper',
      'auction_ending': 'fas fa-clock',
      'outbid': 'fas fa-exclamation-triangle',
      'payment_completed': 'fas fa-credit-card',
      'order_shipped': 'fas fa-shipping-fast',
      'review_received': 'fas fa-star',
      'system': 'fas fa-cog'
    };
    return icons[type] || 'fas fa-bell';
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') return '#ef4444';
    
    const colors: { [key: string]: string } = {
      'auction_won': '#10b981',
      'bid_placed': '#3b82f6',
      'auction_ending': '#f59e0b',
      'outbid': '#ef4444',
      'payment_completed': '#10b981',
      'order_shipped': '#8b5cf6',
      'review_received': '#f59e0b',
      'system': '#6b7280'
    };
    return colors[type] || '#6b7280';
  };

  const filteredNotifications = notifications.filter(notification => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'unread') return !notification.isRead;
    if (selectedTab === 'read') return notification.isRead;
    return notification.type === selectedTab;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    // Navigate based on notification type
    if (notification.data?.auctionId) {
      onNavigate?.('auction-detail', { auctionId: notification.data.auctionId });
    } else if (notification.data?.orderId) {
      onNavigate?.('order-detail', { orderId: notification.data.orderId });
    } else if (notification.data?.paymentId) {
      onNavigate?.('payment-detail', { paymentId: notification.data.paymentId });
    }
  };

  if (loading) {
    return (
      <div className="notifications-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="container">
        <div className="page-header">
          <button className="back-button" onClick={() => onNavigate?.('home')}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <h1>
            <i className="fas fa-bell"></i>
            Notifications
            {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
          </h1>
          <div className="header-actions">
            {unreadCount > 0 && (
              <button className="btn-outline" onClick={markAllAsRead}>
                <i className="fas fa-check-double"></i>
                Mark All Read
              </button>
            )}
            <button 
              className="btn-primary"
              onClick={() => setShowPreferences(!showPreferences)}
            >
              <i className="fas fa-cog"></i>
              Settings
            </button>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}

        {showPreferences && preferences && (
          <div className="preferences-section">
            <div className="preferences-card">
              <h3>Notification Preferences</h3>
              
              <div className="preference-group">
                <h4>Email Notifications</h4>
                <div className="preference-options">
                  <label className="preference-option">
                    <input
                      type="checkbox"
                      checked={preferences.email.bidding}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        email: { ...preferences.email, bidding: e.target.checked }
                      })}
                    />
                    <span>Bidding updates</span>
                  </label>
                  <label className="preference-option">
                    <input
                      type="checkbox"
                      checked={preferences.email.auctions}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        email: { ...preferences.email, auctions: e.target.checked }
                      })}
                    />
                    <span>Auction notifications</span>
                  </label>
                  <label className="preference-option">
                    <input
                      type="checkbox"
                      checked={preferences.email.orders}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        email: { ...preferences.email, orders: e.target.checked }
                      })}
                    />
                    <span>Order updates</span>
                  </label>
                  <label className="preference-option">
                    <input
                      type="checkbox"
                      checked={preferences.email.marketing}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        email: { ...preferences.email, marketing: e.target.checked }
                      })}
                    />
                    <span>Marketing emails</span>
                  </label>
                </div>
              </div>

              <div className="preference-group">
                <h4>Push Notifications</h4>
                <div className="preference-options">
                  <label className="preference-option">
                    <input
                      type="checkbox"
                      checked={preferences.push.bidding}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        push: { ...preferences.push, bidding: e.target.checked }
                      })}
                    />
                    <span>Bidding updates</span>
                  </label>
                  <label className="preference-option">
                    <input
                      type="checkbox"
                      checked={preferences.push.auctions}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        push: { ...preferences.push, auctions: e.target.checked }
                      })}
                    />
                    <span>Auction notifications</span>
                  </label>
                  <label className="preference-option">
                    <input
                      type="checkbox"
                      checked={preferences.push.orders}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        push: { ...preferences.push, orders: e.target.checked }
                      })}
                    />
                    <span>Order updates</span>
                  </label>
                </div>
              </div>

              <div className="preference-actions">
                <button 
                  className="btn-primary"
                  onClick={() => updatePreferences(preferences)}
                >
                  Save Preferences
                </button>
                <button 
                  className="btn-ghost"
                  onClick={() => setShowPreferences(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="notifications-tabs">
          {[
            { key: 'all', label: 'All', count: notifications.length },
            { key: 'unread', label: 'Unread', count: unreadCount },
            { key: 'auction_won', label: 'Auction Won' },
            { key: 'bid_placed', label: 'Bids' },
            { key: 'order_shipped', label: 'Orders' }
          ].map(tab => (
            <button
              key={tab.key}
              className={`tab-btn ${selectedTab === tab.key ? 'active' : ''}`}
              onClick={() => setSelectedTab(tab.key)}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="tab-count">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="notifications-list">
          {filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-bell-slash"></i>
              <h3>No notifications</h3>
              <p>You're all caught up! No new notifications to show.</p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div 
                key={notification._id} 
                className={`notification-card ${!notification.isRead ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-content">
                  <div 
                    className="notification-icon"
                    style={{ color: getNotificationColor(notification.type, notification.priority) }}
                  >
                    <i className={getNotificationIcon(notification.type)}></i>
                  </div>
                  
                  <div className="notification-body">
                    <div className="notification-header">
                      <h4>{notification.title}</h4>
                      <div className="notification-meta">
                        <span className="notification-time">
                          {new Date(notification.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {notification.priority === 'high' && (
                          <span className="priority-badge">High Priority</span>
                        )}
                      </div>
                    </div>
                    
                    <p className="notification-message">{notification.message}</p>
                    
                    {notification.data?.imageUrl && (
                      <div className="notification-image">
                        <img src={notification.data.imageUrl} alt="Notification" />
                      </div>
                    )}
                    
                    {notification.data?.bidAmount && (
                      <div className="notification-amount">
                        <i className="fas fa-dollar-sign"></i>
                        {notification.data.bidAmount}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="notification-actions">
                  {!notification.isRead && (
                    <button
                      className="mark-read-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification._id);
                      }}
                    >
                      <i className="fas fa-check"></i>
                    </button>
                  )}
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification._id);
                    }}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .notifications-page {
          min-height: 100vh;
          background: #f8fafc;
          padding: 2rem 0;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .back-button {
          background: none;
          border: none;
          color: #6b7280;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .page-header h1 {
          margin: 0;
          color: #1f2937;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .unread-badge {
          background: #ef4444;
          color: white;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 10px;
          font-weight: 600;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
        }

        .preferences-section {
          margin-bottom: 2rem;
        }

        .preferences-card {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .preferences-card h3 {
          margin: 0 0 1.5rem 0;
          color: #1f2937;
        }

        .preference-group {
          margin-bottom: 2rem;
        }

        .preference-group h4 {
          margin: 0 0 1rem 0;
          color: #374151;
          font-size: 1rem;
        }

        .preference-options {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .preference-option {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
        }

        .preference-option input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .preference-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .notifications-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          background: white;
          padding: 0.5rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow-x: auto;
        }

        .tab-btn {
          padding: 0.75rem 1rem;
          border: none;
          background: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .tab-btn.active {
          background: #3b82f6;
          color: white;
        }

        .tab-count {
          background: rgba(0, 0, 0, 0.1);
          padding: 0.125rem 0.375rem;
          border-radius: 10px;
          font-size: 0.75rem;
        }

        .tab-btn.active .tab-count {
          background: rgba(255, 255, 255, 0.2);
        }

        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .notification-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .notification-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }

        .notification-card.unread {
          border-left: 4px solid #3b82f6;
          background: #fefefe;
        }

        .notification-content {
          display: flex;
          gap: 1rem;
          flex: 1;
        }

        .notification-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.125rem;
          flex-shrink: 0;
        }

        .notification-body {
          flex: 1;
        }

        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }

        .notification-header h4 {
          margin: 0;
          color: #1f2937;
          font-size: 1rem;
        }

        .notification-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .notification-time {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .priority-badge {
          background: #ef4444;
          color: white;
          font-size: 0.75rem;
          padding: 0.125rem 0.375rem;
          border-radius: 10px;
          font-weight: 500;
        }

        .notification-message {
          margin: 0 0 1rem 0;
          color: #6b7280;
          line-height: 1.5;
        }

        .notification-image {
          width: 60px;
          height: 60px;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .notification-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .notification-amount {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: #10b981;
          font-weight: 600;
          font-size: 1.125rem;
        }

        .notification-actions {
          display: flex;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .mark-read-btn, .delete-btn {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .mark-read-btn {
          background: #eff6ff;
          color: #3b82f6;
        }

        .mark-read-btn:hover {
          background: #dbeafe;
        }

        .delete-btn {
          background: #fef2f2;
          color: #ef4444;
        }

        .delete-btn:hover {
          background: #fee2e2;
        }

        .btn-primary, .btn-outline, .btn-ghost {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
          border: none;
        }

        .btn-outline {
          background: white;
          color: #3b82f6;
          border: 1px solid #3b82f6;
        }

        .btn-ghost {
          background: none;
          color: #6b7280;
          border: 1px solid #d1d5db;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-outline:hover {
          background: #eff6ff;
        }

        .btn-ghost:hover {
          background: #f9fafb;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #6b7280;
        }

        .empty-state i {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-state h3 {
          margin: 0 0 0.5rem 0;
          color: #374151;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
          gap: 1rem;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-banner {
          background: #fef2f2;
          color: #dc2626;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .header-actions {
            justify-content: space-between;
          }

          .notification-content {
            flex-direction: column;
            gap: 0.75rem;
          }

          .notification-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .preference-actions {
            justify-content: stretch;
          }

          .preference-actions button {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationsPage;
