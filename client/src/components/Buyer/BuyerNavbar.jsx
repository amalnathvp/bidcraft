import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useBuyerAuth } from '../../contexts/BuyerAuthContext.jsx';
import { BellIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBuyerNotifications, getBuyerUnreadCount, markBuyerNotificationAsRead } from '../../api/buyerNotifications';

export const BuyerNavbar = () => {
  const { isAuthenticated, buyer, logout, isLoggingOut } = useBuyerAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch notifications data
  const { data: notificationsData, isLoading: notificationsLoading } = useQuery({
    queryKey: ['buyerNotifications'],
    queryFn: () => getBuyerNotifications(1, 5), // Get first 5 notifications for navbar
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch unread count
  const { data: unreadData, isLoading: unreadLoading } = useQuery({
    queryKey: ['buyerUnreadCount'],
    queryFn: getBuyerUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: markBuyerNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyerNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['buyerUnreadCount'] });
    },
  });

  const notifications = notificationsData?.notifications || [];
  const unreadCount = unreadData?.unreadCount || 0;

  // Show popup when new notifications arrive
  useEffect(() => {
    if (unreadCount > 0) {
      setShowNotificationPopup(true);
      const timer = setTimeout(() => {
        setShowNotificationPopup(false);
      }, 5000); // Hide popup after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markAsReadMutation.mutateAsync(notification._id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    setShowNotifications(false);
    
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

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diff = now - notificationTime;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-orange-900">BidCraft</h1>
              <span className="ml-2 text-sm text-gray-600 italic">Authentic Handicrafts</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-700 hover:text-orange-600">Home</Link>
            <Link to="/live-auctions" className="text-gray-700 hover:text-orange-600">Live Auctions</Link>
            {isAuthenticated && (
              <>
                <Link to="/saved" className="text-gray-700 hover:text-orange-600">Saved</Link>
                <Link to="/buyer/bids" className="text-gray-700 hover:text-orange-600">My Bids</Link>
                <Link to="/buyer/orders" className="text-gray-700 hover:text-orange-600">My Orders</Link>
              </>
            )}
            {!isAuthenticated && (
              <Link to="/login" className="text-gray-700 hover:text-orange-600">Sell</Link>
            )}
            {/* <Link to="/about" className="text-gray-700 hover:text-orange-600">About</Link>
            <Link to="/contact" className="text-gray-700 hover:text-orange-600">Contact</Link> */}
          </nav>

          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-700 hover:text-orange-600 focus:outline-none"
                >
                  <BellIcon className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200 max-h-96 overflow-y-auto">
                    <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                      <Link
                        to="/buyer/notifications"
                        className="text-xs text-orange-600 hover:text-orange-700"
                        onClick={() => setShowNotifications(false)}
                      >
                        View all
                      </Link>
                    </div>
                    
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500 text-sm">
                        {notificationsLoading ? 'Loading...' : 'No notifications yet'}
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.map((notification) => (
                          <div
                            key={notification._id}
                            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0 ${
                              !notification.isRead ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start space-x-3">
                              <span className="text-lg flex-shrink-0 mt-0.5">
                                {getNotificationIcon(notification.type)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {formatTimestamp(notification.createdAt)}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {notifications.length > 5 && (
                      <div className="px-4 py-2 border-t border-gray-100">
                        <Link
                          to="/buyer/notifications"
                          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                          onClick={() => setShowNotifications(false)}
                        >
                          View all {notificationsData?.totalNotifications || notifications.length} notifications
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-orange-600 focus:outline-none"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {buyer?.firstName?.charAt(0)?.toUpperCase() || buyer?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="font-medium">
                      {buyer?.firstName || buyer?.name?.split(' ')[0] || 'User'}
                    </span>
                    <svg 
                      className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {buyer?.firstName && buyer?.lastName 
                          ? `${buyer.firstName} ${buyer.lastName}`
                          : buyer?.name || 'User'
                        }
                      </p>
                      <p className="text-sm text-gray-500">{buyer?.email}</p>
                    </div>
                    
                    <Link
                      to="/buyer/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      My Profile
                    </Link>
                    
                    <Link
                      to="/buyer/bids"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      My Bids
                    </Link>
                    
                    <Link
                      to="/buyer/watchlist"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      Watchlist
                    </Link>
                    
                    <div className="border-t border-gray-100">
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      >
                        {isLoggingOut ? 'Signing out...' : 'Sign out'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link 
                  to="/buyer/login" 
                  className="text-gray-700 hover:text-orange-600 font-medium"
                >
                  Login
                </Link>
                <Link 
                  to="/buyer/signup" 
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notification Popup */}
      {showNotificationPopup && unreadCount > 0 && (
        <div className="fixed top-20 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 max-w-sm">
          <div className="flex items-center space-x-3">
            <BellIcon className="h-6 w-6 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {unreadCount === 1 ? 'New notification!' : `${unreadCount} new notifications!`}
              </p>
              <p className="text-xs text-gray-500">Click to view all notifications</p>
            </div>
            <button
              onClick={() => setShowNotificationPopup(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <Link
            to="/buyer/notifications"
            className="block mt-2 text-xs text-orange-600 hover:text-orange-800"
            onClick={() => setShowNotificationPopup(false)}
          >
            View all notifications →
          </Link>
        </div>
      )}

      {/* Mobile menu overlay */}
      {(showDropdown || showNotifications) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowDropdown(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
};