import React, { useEffect, useState } from 'react';
import { useSocket, useNotifications } from '../hooks/useSocket';
import { authService } from '../services/auth';

// Real-time notification component
export const RealTimeNotifications: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="notifications-container">
      {/* Notification Bell */}
      <div className="notification-bell" onClick={() => setShowNotifications(!showNotifications)}>
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </div>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Notifications</h3>
            <div className="notification-actions">
              <button onClick={markAllAsRead} className="btn-small">
                Mark All Read
              </button>
              <button onClick={clearNotifications} className="btn-small">
                Clear All
              </button>
            </div>
          </div>

          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div 
                  key={index} 
                  className={`notification-item ${notification.type}`}
                  onClick={() => markAsRead(index)}
                >
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <span className="notification-time">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        .notifications-container {
          position: relative;
        }

        .notification-bell {
          position: relative;
          cursor: pointer;
          font-size: 1.5rem;
          padding: 0.5rem;
          border-radius: 50%;
          transition: background-color 0.2s;
        }

        .notification-bell:hover {
          background-color: #f3f4f6;
        }

        .notification-badge {
          position: absolute;
          top: 0;
          right: 0;
          background: #dc2626;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .notifications-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          width: 350px;
          max-height: 400px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          z-index: 1000;
        }

        .notifications-header {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .notifications-header h3 {
          margin: 0;
          font-size: 1.1rem;
        }

        .notification-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-small {
          padding: 0.25rem 0.5rem;
          font-size: 12px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn-small:hover {
          background: #f3f4f6;
        }

        .notifications-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .no-notifications {
          padding: 2rem;
          text-align: center;
          color: #6b7280;
        }

        .notification-item {
          padding: 1rem;
          border-bottom: 1px solid #f3f4f6;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .notification-item:hover {
          background: #f9fafb;
        }

        .notification-item:last-child {
          border-bottom: none;
        }

        .notification-item.success {
          border-left: 4px solid #10b981;
        }

        .notification-item.error {
          border-left: 4px solid #ef4444;
        }

        .notification-item.warning {
          border-left: 4px solid #f59e0b;
        }

        .notification-item.info {
          border-left: 4px solid #3b82f6;
        }

        .notification-content h4 {
          margin: 0 0 0.25rem 0;
          font-size: 14px;
          font-weight: 600;
        }

        .notification-content p {
          margin: 0 0 0.5rem 0;
          font-size: 13px;
          color: #6b7280;
        }

        .notification-time {
          font-size: 12px;
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
};

// Real-time connection status component
export const ConnectionStatus: React.FC = () => {
  const { isConnected, connectionError } = useSocket();

  return (
    <div className="connection-status">
      {isConnected ? (
        <div className="status-connected">
          <span className="status-indicator green"></span>
          Real-time updates active
        </div>
      ) : (
        <div className="status-disconnected">
          <span className="status-indicator yellow"></span>
          {connectionError || 'Connecting...'}
        </div>
      )}

      <style>{`
        .connection-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 12px;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
        }

        .status-connected {
          color: #047857;
          background: #d1fae5;
        }

        .status-disconnected {
          color: #92400e;
          background: #fef3c7;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-indicator.green {
          background: #10b981;
        }

        .status-indicator.yellow {
          background: #f59e0b;
        }
      `}</style>
    </div>
  );
};

// Real-time auction dashboard hook
export const useRealTimeDashboard = () => {
  const { isConnected } = useSocket();
  const [activeAuctions, setActiveAuctions] = useState<string[]>([]);
  const [recentBids, setRecentBids] = useState<any[]>([]);
  const [auctionUpdates, setAuctionUpdates] = useState<any[]>([]);

  // Track joined auction rooms
  const joinAuctionRoom = (auctionId: string) => {
    if (isConnected && !activeAuctions.includes(auctionId)) {
      setActiveAuctions(prev => [...prev, auctionId]);
    }
  };

  const leaveAuctionRoom = (auctionId: string) => {
    setActiveAuctions(prev => prev.filter(id => id !== auctionId));
  };

  // Monitor real-time events
  useEffect(() => {
    if (!isConnected) return;

    // Set up global event listeners for dashboard
    const handleNewBid = (bidData: any) => {
      setRecentBids(prev => [bidData, ...prev.slice(0, 9)]); // Keep last 10 bids
    };

    const handleAuctionUpdate = (updateData: any) => {
      setAuctionUpdates(prev => [updateData, ...prev.slice(0, 19)]); // Keep last 20 updates
    };

    // In a real implementation, you'd subscribe to events here
    // socketService.on('new-bid', handleNewBid);
    // socketService.on('auction-update', handleAuctionUpdate);

    return () => {
      // Cleanup event listeners
      // socketService.off('new-bid', handleNewBid);
      // socketService.off('auction-update', handleAuctionUpdate);
    };
  }, [isConnected]);

  return {
    isConnected,
    activeAuctions,
    recentBids,
    auctionUpdates,
    joinAuctionRoom,
    leaveAuctionRoom
  };
};

// Real-time bidding status component
export const BiddingStatus: React.FC<{ auctionId: string }> = ({ auctionId }) => {
  const [bidStatus, setBidStatus] = useState<'idle' | 'placing' | 'confirmed' | 'rejected'>('idle');
  const [lastBidAmount, setLastBidAmount] = useState<number>(0);

  useEffect(() => {
    // Monitor bid status for this auction
    // In a real implementation, you'd listen to bid events for this specific auction
  }, [auctionId]);

  if (bidStatus === 'idle') return null;

  return (
    <div className={`bidding-status ${bidStatus}`}>
      {bidStatus === 'placing' && (
        <>
          <div className="spinner"></div>
          Placing bid of ${lastBidAmount}...
        </>
      )}
      {bidStatus === 'confirmed' && (
        <>
          ✅ Bid of ${lastBidAmount} confirmed!
        </>
      )}
      {bidStatus === 'rejected' && (
        <>
          ❌ Bid of ${lastBidAmount} was rejected
        </>
      )}

      <style>{`
        .bidding-status {
          position: fixed;
          bottom: 20px;
          right: 20px;
          padding: 1rem;
          border-radius: 8px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          z-index: 1000;
          animation: slideIn 0.3s ease-out;
        }

        .bidding-status.placing {
          background: #fef3c7;
          color: #92400e;
        }

        .bidding-status.confirmed {
          background: #d1fae5;
          color: #047857;
        }

        .bidding-status.rejected {
          background: #fee2e2;
          color: #dc2626;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

// Usage example for integrating into main app
export const RealTimeBiddingExample: React.FC = () => {
  const { isConnected } = useSocket();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Check authentication and initialize socket connection
    const initializeRealTime = async () => {
      if (authService.isAuthenticated()) {
        const user = authService.getCurrentUserFromStorage();
        setCurrentUser(user);
      }
    };

    initializeRealTime();
  }, []);

  if (!authService.isAuthenticated()) {
    return (
      <div className="real-time-disabled">
        <p>Please log in to enable real-time bidding features</p>
      </div>
    );
  }

  return (
    <div className="real-time-wrapper">
      {/* Connection Status */}
      <ConnectionStatus />
      
      {/* Real-time Notifications */}
      <RealTimeNotifications />
      
      {/* Your app content here */}
      <div className="app-content">
        <h1>Real-time Bidding System Active</h1>
        <p>Connection Status: {isConnected ? '✅ Connected' : '❌ Disconnected'}</p>
        
        {/* Example of how to use real-time components */}
        <div className="auction-example">
          <p>Join auction rooms, place bids, and receive real-time updates!</p>
        </div>
      </div>

      <style>{`
        .real-time-wrapper {
          position: relative;
        }

        .real-time-disabled {
          padding: 2rem;
          text-align: center;
          background: #fef3c7;
          color: #92400e;
          border-radius: 8px;
          margin: 1rem;
        }

        .app-content {
          padding: 1rem;
        }

        .auction-example {
          margin: 2rem 0;
          padding: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #f9fafb;
        }
      `}</style>
    </div>
  );
};

export default RealTimeBiddingExample;
