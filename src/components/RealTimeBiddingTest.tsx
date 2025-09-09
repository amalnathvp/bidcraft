import React, { useState } from 'react';
import { useSocket, useAuctionRoom, useLiveBidding, useNotifications } from '../hooks/useSocket';
import BidModal from './BidModal';

// Test component to demonstrate real-time bidding functionality
const RealTimeBiddingTest: React.FC = () => {
  const [testAuctionId] = useState('test-auction-123');
  const [showBidModal, setShowBidModal] = useState(false);

  // Socket hooks
  const { isConnected, connectionError } = useSocket();
  const { isInRoom, viewerCount, currentPrice } = useAuctionRoom(testAuctionId);
  const {
    isInLiveRoom,
    currentBid,
    totalBids,
    recentBids,
    bidStatus,
    bidError,
    placeBid,
    setupAutoBid,
    cancelAutoBid
  } = useLiveBidding(testAuctionId);
  const { notifications, unreadCount } = useNotifications();

  const handleQuickBid = (amount: number) => {
    placeBid(amount, 'manual');
  };

  const handleSetupAutoBid = () => {
    setupAutoBid(500); // Max bid of $500
  };

  const mockAuctionItem = {
    id: testAuctionId,
    title: 'Test Auction - Handcrafted Vase',
    currentBid: currentBid || 125,
    image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=300&fit=crop',
    timeLeft: '2h 15m',
    seller: 'Test Artisan',
    category: 'Pottery',
    condition: 'New',
    watchers: viewerCount || 5,
    bidCount: totalBids || 3,
    startingBid: 50,
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    isHot: true,
    reserveMet: true
  };

  return (
    <div className="realtime-test">
      <div className="container">
        <h1>🔴 Real-Time Bidding System Test</h1>
        
        {/* Connection Status */}
        <div className="status-panel">
          <h2>Connection Status</h2>
          <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="indicator"></span>
            {isConnected ? 'Connected to real-time system' : 'Disconnected'}
          </div>
          {connectionError && (
            <div className="error">Error: {connectionError}</div>
          )}
        </div>

        {/* Room Status */}
        <div className="room-panel">
          <h2>Room Status</h2>
          <div className="room-info">
            <div className="room-item">
              <strong>Auction Room:</strong> {isInRoom ? '✅ Joined' : '❌ Not joined'}
            </div>
            <div className="room-item">
              <strong>Live Room:</strong> {isInLiveRoom ? '🔴 Live' : '⚪ Standard'}
            </div>
            <div className="room-item">
              <strong>Viewers:</strong> {viewerCount || 0}
            </div>
          </div>
        </div>

        {/* Bidding Panel */}
        <div className="bidding-panel">
          <h2>Live Bidding</h2>
          <div className="bid-info">
            <div className="current-bid">
              <span className="label">Current Bid:</span>
              <span className="amount">${currentBid || currentPrice || 125}</span>
            </div>
            <div className="total-bids">
              <span className="label">Total Bids:</span>
              <span className="count">{totalBids || 0}</span>
            </div>
          </div>

          {/* Bid Status */}
          {bidStatus !== 'idle' && (
            <div className={`bid-status ${bidStatus}`}>
              {bidStatus === 'placing' && '⏳ Placing bid...'}
              {bidStatus === 'confirmed' && '✅ Bid confirmed!'}
              {bidStatus === 'rejected' && `❌ ${bidError}`}
            </div>
          )}

          {/* Quick Bid Buttons */}
          <div className="quick-bids">
            <h3>Quick Bid Actions</h3>
            <div className="bid-buttons">
              <button 
                onClick={() => handleQuickBid((currentBid || 125) + 5)}
                disabled={!isConnected || bidStatus === 'placing'}
                className="bid-btn"
              >
                Bid ${(currentBid || 125) + 5}
              </button>
              <button 
                onClick={() => handleQuickBid((currentBid || 125) + 10)}
                disabled={!isConnected || bidStatus === 'placing'}
                className="bid-btn"
              >
                Bid ${(currentBid || 125) + 10}
              </button>
              <button 
                onClick={() => handleQuickBid((currentBid || 125) + 25)}
                disabled={!isConnected || bidStatus === 'placing'}
                className="bid-btn"
              >
                Bid ${(currentBid || 125) + 25}
              </button>
            </div>

            <div className="auto-bid-section">
              <button 
                onClick={handleSetupAutoBid}
                disabled={!isConnected}
                className="auto-bid-btn"
              >
                🤖 Setup Auto-Bid ($500 max)
              </button>
              <button 
                onClick={() => cancelAutoBid()}
                disabled={!isConnected}
                className="cancel-auto-bid-btn"
              >
                ❌ Cancel Auto-Bid
              </button>
            </div>

            <button 
              onClick={() => setShowBidModal(true)}
              disabled={!isConnected}
              className="modal-bid-btn"
            >
              Open Bid Modal
            </button>
          </div>
        </div>

        {/* Recent Bids */}
        {recentBids.length > 0 && (
          <div className="recent-bids-panel">
            <h2>Recent Bids</h2>
            <div className="bids-list">
              {recentBids.slice(0, 5).map((bid, index) => (
                <div key={index} className="bid-item">
                  <span className="bid-amount">${bid.amount}</span>
                  <span className="bid-bidder">{bid.bidder.name}</span>
                  <span className="bid-time">
                    {new Date(bid.bidTime).toLocaleTimeString()}
                  </span>
                  <span className="bid-type">{bid.bidType}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notifications */}
        <div className="notifications-panel">
          <h2>Real-Time Notifications</h2>
          <div className="notification-summary">
            <span className="unread-count">Unread: {unreadCount}</span>
            <span className="total-count">Total: {notifications.length}</span>
          </div>
          
          {notifications.length > 0 && (
            <div className="notifications-list">
              {notifications.slice(0, 3).map((notification, index) => (
                <div key={index} className={`notification-item ${notification.type}`}>
                  <strong>{notification.title}</strong>
                  <p>{notification.message}</p>
                  <small>{new Date(notification.timestamp).toLocaleTimeString()}</small>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Debug Information */}
        <div className="debug-panel">
          <h2>Debug Information</h2>
          <div className="debug-info">
            <div className="debug-item">
              <strong>Socket Connected:</strong> {isConnected ? 'Yes' : 'No'}
            </div>
            <div className="debug-item">
              <strong>Auction ID:</strong> {testAuctionId}
            </div>
            <div className="debug-item">
              <strong>In Auction Room:</strong> {isInRoom ? 'Yes' : 'No'}
            </div>
            <div className="debug-item">
              <strong>In Live Room:</strong> {isInLiveRoom ? 'Yes' : 'No'}
            </div>
            <div className="debug-item">
              <strong>Bid Status:</strong> {bidStatus}
            </div>
          </div>
        </div>

        {/* Bid Modal */}
        {showBidModal && (
          <BidModal
            item={mockAuctionItem}
            onClose={() => setShowBidModal(false)}
            onSubmit={(amount) => {
              console.log('Bid submitted through modal:', amount);
              setShowBidModal(false);
            }}
          />
        )}
      </div>

      <style>{`
        .realtime-test {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .realtime-test h1 {
          text-align: center;
          color: #dc2626;
          margin-bottom: 2rem;
        }

        .status-panel, .room-panel, .bidding-panel, 
        .recent-bids-panel, .notifications-panel, .debug-panel {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .status-panel h2, .room-panel h2, .bidding-panel h2,
        .recent-bids-panel h2, .notifications-panel h2, .debug-panel h2 {
          margin-top: 0;
          color: #374151;
        }

        .status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border-radius: 6px;
          font-weight: 500;
        }

        .status.connected {
          background: #d1fae5;
          color: #047857;
        }

        .status.disconnected {
          background: #fee2e2;
          color: #dc2626;
        }

        .indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: currentColor;
        }

        .error {
          color: #dc2626;
          margin-top: 0.5rem;
          font-size: 14px;
        }

        .room-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .room-item {
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 6px;
        }

        .bid-info {
          display: flex;
          gap: 2rem;
          margin-bottom: 1rem;
        }

        .current-bid, .total-bids {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .label {
          font-size: 14px;
          color: #6b7280;
        }

        .amount {
          font-size: 1.5rem;
          font-weight: bold;
          color: #059669;
        }

        .count {
          font-size: 1.25rem;
          font-weight: bold;
          color: #3b82f6;
        }

        .bid-status {
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          font-weight: 500;
        }

        .bid-status.placing {
          background: #fef3c7;
          color: #92400e;
        }

        .bid-status.confirmed {
          background: #d1fae5;
          color: #047857;
        }

        .bid-status.rejected {
          background: #fee2e2;
          color: #dc2626;
        }

        .quick-bids h3 {
          margin-bottom: 1rem;
          color: #374151;
        }

        .bid-buttons {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .bid-btn {
          padding: 0.75rem 1rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .bid-btn:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .bid-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
        }

        .auto-bid-section {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .auto-bid-btn {
          padding: 0.75rem 1rem;
          background: #059669;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }

        .auto-bid-btn:hover:not(:disabled) {
          background: #047857;
        }

        .cancel-auto-bid-btn {
          padding: 0.75rem 1rem;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }

        .cancel-auto-bid-btn:hover:not(:disabled) {
          background: #b91c1c;
        }

        .modal-bid-btn {
          padding: 0.75rem 1rem;
          background: #7c3aed;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          width: 100%;
        }

        .modal-bid-btn:hover:not(:disabled) {
          background: #6d28d9;
        }

        .bids-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .bid-item {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 1rem;
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 6px;
          align-items: center;
        }

        .bid-amount {
          font-weight: bold;
          color: #059669;
        }

        .bid-bidder {
          color: #6b7280;
        }

        .bid-time {
          color: #9ca3af;
          font-size: 14px;
        }

        .bid-type {
          color: #3b82f6;
          font-size: 12px;
          text-transform: uppercase;
        }

        .notification-summary {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .unread-count {
          background: #dc2626;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 14px;
        }

        .total-count {
          background: #6b7280;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 14px;
        }

        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .notification-item {
          padding: 1rem;
          border-radius: 6px;
          border-left: 4px solid;
        }

        .notification-item.success {
          background: #d1fae5;
          border-color: #10b981;
        }

        .notification-item.error {
          background: #fee2e2;
          border-color: #ef4444;
        }

        .notification-item.warning {
          background: #fef3c7;
          border-color: #f59e0b;
        }

        .notification-item.info {
          background: #dbeafe;
          border-color: #3b82f6;
        }

        .notification-item strong {
          display: block;
          margin-bottom: 0.25rem;
        }

        .notification-item p {
          margin: 0 0 0.5rem 0;
          font-size: 14px;
        }

        .notification-item small {
          color: #6b7280;
          font-size: 12px;
        }

        .debug-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .debug-item {
          padding: 0.75rem;
          background: #f3f4f6;
          border-radius: 6px;
          font-family: monospace;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .realtime-test {
            padding: 1rem;
          }

          .bid-info {
            flex-direction: column;
            gap: 1rem;
          }

          .bid-buttons {
            flex-direction: column;
          }

          .auto-bid-section {
            flex-direction: column;
          }

          .bid-item {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .debug-info {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default RealTimeBiddingTest;
