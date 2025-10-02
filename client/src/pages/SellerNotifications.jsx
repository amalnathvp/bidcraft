import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

// Simple time formatting function
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

// API functions for notifications
const getNotifications = async (page = 1) => {
  console.log('Fetching notifications...'); // Debug log
  const response = await fetch(`/api/notifications?page=${page}`, {
    method: 'GET',
    credentials: 'include',
  });
  
  console.log('Response status:', response.status); // Debug log
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    console.error('API error:', errorData); // Debug log
    throw new Error(errorData.message || 'Failed to fetch notifications');
  }
  
  const data = await response.json();
  console.log('Notifications data:', data); // Debug log
  return data;
};

const markAsRead = async (notificationId) => {
  const response = await fetch(`/api/notifications/${notificationId}/read`, {
    method: 'PATCH',
    credentials: 'include',
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(errorData.message || 'Failed to mark notification as read');
  }
  
  return response.json();
};

const markAllAsRead = async () => {
  const response = await fetch('/api/notifications/mark-all-read', {
    method: 'PATCH',
    credentials: 'include',
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(errorData.message || 'Failed to mark all notifications as read');
  }
  
  return response.json();
};

const deleteNotification = async (notificationId) => {
  const response = await fetch(`/api/notifications/${notificationId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(errorData.message || 'Failed to delete notification');
  }
  
  return response.json();
};

const NotificationCard = ({ notification, onMarkAsRead, onDelete, onNotificationClick }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_bid':
        return '💰';
      case 'auction_won':
        return '🏆';
      case 'auction_ended':
        return '⏰';
      default:
        return '📢';
    }
  };

  const handleCardClick = () => {
    // Mark as read if not already read
    if (!notification.isRead) {
      onMarkAsRead(notification._id);
    }
    // Call the notification click handler for navigation
    onNotificationClick(notification);
  };

  return (
    <div 
      className={`p-4 border rounded-lg transition-colors cursor-pointer hover:shadow-md ${
        notification.isRead 
          ? 'bg-white border-gray-200' 
          : 'bg-blue-50 border-blue-200'
      }`}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="text-2xl">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-medium ${
                notification.isRead ? 'text-gray-900' : 'text-blue-900'
              }`}>
                {notification.title}
              </h3>
              {!notification.isRead && (
                <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {notification.message}
            </p>
            {notification.auction && (
              <p className="text-xs text-gray-500 mt-2">
                Auction: {notification.auction.itemName}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              {formatTimeAgo(notification.createdAt)}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification._id);
          }}
          className="text-gray-400 hover:text-red-600 p-1"
          title="Delete notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export const SellerNotifications = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications', currentPage],
    queryFn: () => getNotifications(currentPage),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const handleMarkAsRead = (notificationId) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (notificationId) => {
    deleteMutation.mutate(notificationId);
  };

  const handleNotificationClick = (notification) => {
    // Navigate to the relevant auction detail page if auction exists
    if (notification.auction && notification.auction._id) {
      navigate(`/seller/auction-detail/${notification.auction._id}`);
    } else if (notification.metadata && notification.metadata.auctionId) {
      // Fallback to metadata auctionId if direct auction reference is missing
      navigate(`/seller/auction-detail/${notification.metadata.auctionId}`);
    } else {
      // If no auction reference, navigate to general auction list
      navigate('/seller/myauction');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Notifications</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  const { notifications = [], unreadCount = 0, totalPages = 1 } = data || {};

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {markAllAsReadMutation.isPending ? 'Marking...' : 'Mark All as Read'}
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Notifications</h2>
          <p className="text-gray-600">You're all caught up! New notifications will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification._id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
              onNotificationClick={handleNotificationClick}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-8">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};