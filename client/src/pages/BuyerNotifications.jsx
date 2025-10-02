import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { 
  getBuyerNotifications, 
  markBuyerNotificationAsRead, 
  markAllBuyerNotificationsAsRead, 
  deleteBuyerNotification 
} from '../api/buyerNotifications';
import { BuyerNavbar } from '../components/Buyer/BuyerNavbar';
import { 
  BellIcon, 
  XMarkIcon, 
  CheckIcon, 
  TrashIcon, 
  EyeIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const BuyerNotifications = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState('all');
  const [filterRead, setFilterRead] = useState('all');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch notifications
  const { data: notificationsData, isLoading, error } = useQuery({
    queryKey: ['buyerNotifications', currentPage, filterType, filterRead],
    queryFn: () => getBuyerNotifications(currentPage, 20),
    refetchInterval: 30000,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: markBuyerNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyerNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['buyerUnreadCount'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: markAllBuyerNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyerNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['buyerUnreadCount'] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: deleteBuyerNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyerNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['buyerUnreadCount'] });
    },
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'outbid': return '❗';
      case 'bid_placed': return '✅';
      case 'auction_won': return '🏆';
      case 'auction_lost': return '😔';
      case 'saved_item_bid': return '💰';
      case 'auction_ending_soon': return '⏰';
      default: return '🔔';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'outbid': return 'Outbid';
      case 'bid_placed': return 'Bid Placed';
      case 'auction_won': return 'Auction Won';
      case 'auction_lost': return 'Auction Lost';
      case 'saved_item_bid': return 'Saved Item Bid';
      case 'auction_ending_soon': return 'Ending Soon';
      default: return 'Notification';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsReadMutation.mutateAsync(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (confirm('Are you sure you want to delete this notification?')) {
      try {
        await deleteNotificationMutation.mutateAsync(notificationId);
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      try {
        await markAsReadMutation.mutateAsync(notification._id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    
    // Navigate to the relevant auction page if auction exists
    if (notification.auction && notification.auction._id) {
      navigate(`/auction/${notification.auction._id}`);
    } else if (notification.metadata && notification.metadata.auctionId) {
      // Fallback to metadata auctionId if direct auction reference is missing
      navigate(`/auction/${notification.metadata.auctionId}`);
    } else {
      // If no auction reference, navigate to live auctions
      navigate('/live-auctions');
    }
  };

  const notifications = notificationsData?.notifications || [];
  const totalPages = notificationsData?.totalPages || 1;
  const unreadCount = notificationsData?.unreadCount || 0;

  // Filter notifications based on selected filters
  const filteredNotifications = notifications.filter(notification => {
    if (filterType !== 'all' && notification.type !== filterType) return false;
    if (filterRead === 'read' && !notification.isRead) return false;
    if (filterRead === 'unread' && notification.isRead) return false;
    return true;
  });

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BuyerNavbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error loading notifications: {error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BuyerNavbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BellIcon className="h-8 w-8 text-orange-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                </p>
              </div>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                <CheckIcon className="h-4 w-4" />
                <span>{markAllAsReadMutation.isPending ? 'Marking...' : 'Mark all read'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FunnelIcon className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by:</span>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Types</option>
                <option value="bid_placed">Bid Placed</option>
                <option value="outbid">Outbid</option>
                <option value="auction_won">Auction Won</option>
                <option value="auction_lost">Auction Lost</option>
                <option value="saved_item_bid">Saved Item Bid</option>
                <option value="auction_ending_soon">Ending Soon</option>
              </select>
              
              <select
                value={filterRead}
                onChange={(e) => setFilterRead(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>
            
            <div className="text-sm text-gray-500">
              {filteredNotifications.length} of {notifications.length} notifications
            </div>
          </div>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <span className="ml-3 text-gray-600">Loading notifications...</span>
            </div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
            <p className="text-gray-600">
              {filterType !== 'all' || filterRead !== 'all' 
                ? 'Try adjusting your filters to see more notifications.'
                : 'When you participate in auctions, notifications will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`bg-white rounded-lg shadow-sm border-l-4 ${
                  !notification.isRead 
                    ? 'border-l-orange-500 bg-orange-50' 
                    : 'border-l-gray-200'
                } hover:shadow-md transition-shadow cursor-pointer`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">
                          {getNotificationIcon(notification.type)}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {notification.title}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {getTypeLabel(notification.type)}
                          </span>
                          {!notification.isRead && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              New
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center text-sm text-gray-500">
                          <span>{formatTimestamp(notification.createdAt)}</span>
                          {notification.auction && (
                            <>
                              <span className="mx-2">•</span>
                              <span>Auction: {notification.auction.itemName || 'Unknown Item'}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification._id);
                          }}
                          disabled={markAsReadMutation.isPending}
                          className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification._id);
                        }}
                        disabled={deleteNotificationMutation.isPending}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete notification"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === page
                        ? 'bg-orange-600 text-white'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerNotifications;