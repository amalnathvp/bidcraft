import React, { useState, useEffect } from 'react';
import { useSocket, useAuctionRoom, useLiveBidding, useNotifications } from '../hooks/useSocket';
import { authService } from '../services/auth';
import BidModal from './BidModal';
import '../styles/BidModal.css';

interface AuctionDetailProps {
  auctionId: string;
  onNavigate?: (page: string, data?: any) => void;
}

interface AuctionData {
  _id: string;
  title: string;
  description: string;
  currentPrice: number;
  startingPrice: number;
  totalBids: number;
  endTime: string;
  startTime: string;
  images: Array<{
    url: string;
    publicId: string;
    alt?: string;
  }>;
  seller: {
    _id: string;
    name?: string;
    shopName?: string;
  };
  condition: string;
  status: string;
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  reservePrice?: number;
  watchers?: string[];
}

const RealTimeAuction: React.FC<AuctionDetailProps> = ({ auctionId, onNavigate }) => {
  // Socket connection and real-time data
  const { isConnected, connectionError } = useSocket();
  const { isInRoom, viewerCount, currentPrice } = useAuctionRoom(auctionId);
  const {
    isInLiveRoom,
    recentBids,
    currentBid,
    totalBids,
    leadingBidder,
    bidStatus,
    bidError,
    placeBid,
    setupAutoBid,
    cancelAutoBid
  } = useLiveBidding(auctionId);
  const { notifications, unreadCount } = useNotifications();

  // Component state
  const [auctionData, setAuctionData] = useState<AuctionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [autoBidAmount, setAutoBidAmount] = useState<number>(0);
  const [showAutoBidSetup, setShowAutoBidSetup] = useState(false);

  // Mock auction data for demonstration
  useEffect(() => {
    const mockAuctionData: AuctionData = {
      _id: auctionId,
      title: 'Handcrafted Ceramic Vase',
      description: 'Beautiful handcrafted ceramic vase with intricate patterns. Made by local artisan using traditional techniques.',
      currentPrice: 125,
      startingPrice: 50,
      totalBids: 12,
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Started 24 hours ago
      images: [{
        url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600&h=400&fit=crop',
        publicId: 'sample-vase',
        alt: 'Handcrafted ceramic vase'
      }],
      seller: {
        _id: 'seller1',
        name: 'Pottery Studio',
        shopName: 'Artisan Ceramics'
      },
      condition: 'New',
      status: 'active',
      category: {
        _id: 'cat1',
        name: 'Pottery',
        slug: 'pottery'
      },
      reservePrice: 100,
      watchers: ['user1', 'user2', 'user3']
    };

    setAuctionData(mockAuctionData);
    setLoading(false);
  }, [auctionId]);

  // Calculate time remaining
  useEffect(() => {
    if (!auctionData) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const end = new Date(auctionData.endTime);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Auction Ended');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [auctionData]);

  const handlePlaceBid = (amount: number) => {
    if (!authService.isAuthenticated()) {
      alert('Please log in to place bids');
      return;
    }

    placeBid(amount, 'manual');
    setShowBidModal(false);
  };

  const handleSetupAutoBid = () => {
    if (!authService.isAuthenticated()) {
      alert('Please log in to set up auto-bidding');
      return;
    }

    if (autoBidAmount > (currentBid || auctionData?.currentPrice || 0)) {
      setupAutoBid(autoBidAmount);
      setShowAutoBidSetup(false);
      setAutoBidAmount(0);
    }
  };

  const handleWatchAuction = () => {
    setIsWatching(!isWatching);
    // In a real app, this would make an API call
  };

  if (loading) {
    return (
      <div className="auction-detail loading">
        <div className="container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading auction details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !auctionData) {
    return (
      <div className="auction-detail error">
        <div className="container">
          <div className="error-message">
            <h2>Error Loading Auction</h2>
            <p>{error || 'Auction not found'}</p>
            <button onClick={() => onNavigate?.('live-auctions')} className="btn-primary">
              Back to Auctions
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayCurrentPrice = currentBid > 0 ? currentBid : currentPrice > 0 ? currentPrice : auctionData.currentPrice;
  const displayTotalBids = totalBids > 0 ? totalBids : auctionData.totalBids;

  return (
    <div className="auction-detail">
      <div className="container">
        {/* Connection Status */}
        <div className="connection-status">
          {isConnected ? (
            <div className="status-connected">
              🟢 Real-time updates active
              {isInLiveRoom && <span className="live-badge">🔴 LIVE BIDDING</span>}
            </div>
          ) : (
            <div className="status-disconnected">
              🟡 {connectionError || 'Connecting to real-time updates...'}
            </div>
          )}
        </div>

        {/* Notifications */}
        {unreadCount > 0 && (
          <div className="notification-banner">
            🔔 You have {unreadCount} new notifications
          </div>
        )}

        <div className="auction-content">
          {/* Auction Images */}
          <div className="auction-images">
            <div className="main-image">
              <img 
                src={auctionData.images[0]?.url} 
                alt={auctionData.images[0]?.alt || auctionData.title}
              />
              {auctionData.status === 'active' && (
                <div className="auction-badges">
                  {timeRemaining.includes('Ended') ? (
                    <span className="badge ended">ENDED</span>
                  ) : timeRemaining.includes('m') && !timeRemaining.includes('h') && !timeRemaining.includes('d') ? (
                    <span className="badge ending-soon">ENDING SOON</span>
                  ) : (
                    <span className="badge active">ACTIVE</span>
                  )}
                  {displayCurrentPrice >= (auctionData.reservePrice || 0) && (
                    <span className="badge reserve-met">RESERVE MET</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Auction Information */}
          <div className="auction-info">
            <div className="auction-header">
              <h1>{auctionData.title}</h1>
              <div className="auction-meta">
                <span className="category">{auctionData.category.name}</span>
                <span className="condition">Condition: {auctionData.condition}</span>
                <span className="seller">by {auctionData.seller.shopName || auctionData.seller.name}</span>
              </div>
            </div>

            {/* Real-time Bidding Section */}
            <div className="bidding-section">
              <div className="current-bid">
                <h2>Current Bid</h2>
                <div className="bid-amount">${displayCurrentPrice}</div>
                <div className="bid-details">
                  <span>{displayTotalBids} bids</span>
                  {viewerCount > 0 && <span> • {viewerCount} watching</span>}
                  {leadingBidder && <span> • Leading: {leadingBidder.name}</span>}
                </div>
              </div>

              <div className="time-remaining">
                <h3>Time Remaining</h3>
                <div className="countdown">{timeRemaining}</div>
              </div>

              {/* Bidding Controls */}
              {auctionData.status === 'active' && !timeRemaining.includes('Ended') && (
                <div className="bidding-controls">
                  <button 
                    className="btn-primary place-bid"
                    onClick={() => setShowBidModal(true)}
                    disabled={bidStatus === 'placing'}
                  >
                    {bidStatus === 'placing' ? (
                      <>
                        <div className="spinner-small"></div>
                        Placing Bid...
                      </>
                    ) : (
                      'Place Bid'
                    )}
                  </button>

                  <button 
                    className="btn-outline auto-bid"
                    onClick={() => setShowAutoBidSetup(true)}
                  >
                    🤖 Auto-Bid
                  </button>

                  <button 
                    className={`btn-outline watch ${isWatching ? 'watching' : ''}`}
                    onClick={handleWatchAuction}
                  >
                    {isWatching ? '❤️ Watching' : '🤍 Watch'}
                  </button>
                </div>
              )}

              {/* Bid Status Messages */}
              {bidStatus === 'confirmed' && (
                <div className="bid-status confirmed">
                  ✅ Your bid has been confirmed!
                </div>
              )}
              {bidStatus === 'rejected' && bidError && (
                <div className="bid-status rejected">
                  ❌ {bidError}
                </div>
              )}
            </div>

            {/* Recent Bids */}
            {recentBids.length > 0 && (
              <div className="recent-bids-section">
                <h3>Recent Bids</h3>
                <div className="bids-timeline">
                  {recentBids.slice(0, 5).map((bid, index) => (
                    <div key={index} className="bid-timeline-item">
                      <div className="bid-info">
                        <span className="bid-amount">${bid.amount}</span>
                        <span className="bid-bidder">{bid.bidder.name}</span>
                      </div>
                      <div className="bid-time">
                        {new Date(bid.bidTime).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Auction Description */}
            <div className="auction-description">
              <h3>Description</h3>
              <p>{auctionData.description}</p>
            </div>

            {/* Auction Details */}
            <div className="auction-details">
              <h3>Auction Details</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="label">Starting Price:</span>
                  <span className="value">${auctionData.startingPrice}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Reserve Price:</span>
                  <span className="value">
                    {auctionData.reservePrice ? `$${auctionData.reservePrice}` : 'No Reserve'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Started:</span>
                  <span className="value">
                    {new Date(auctionData.startTime).toLocaleDateString()}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Ends:</span>
                  <span className="value">
                    {new Date(auctionData.endTime).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bid Modal */}
        {showBidModal && (
          <BidModal
            item={{
              id: auctionData._id,
              title: auctionData.title,
              currentBid: displayCurrentPrice,
              image: auctionData.images[0]?.url || '',
              timeLeft: timeRemaining,
              seller: auctionData.seller.name || 'Unknown',
              category: auctionData.category.name,
              condition: auctionData.condition,
              watchers: auctionData.watchers?.length || 0,
              bidCount: displayTotalBids,
              startingBid: auctionData.startingPrice,
              endTime: auctionData.endTime,
              isHot: displayTotalBids > 5,
              reserveMet: displayCurrentPrice >= (auctionData.reservePrice || 0)
            }}
            onClose={() => setShowBidModal(false)}
            onSubmit={handlePlaceBid}
          />
        )}

        {/* Auto-Bid Setup Modal */}
        {showAutoBidSetup && (
          <div className="modal-overlay" onClick={() => setShowAutoBidSetup(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Setup Auto-Bidding</h3>
                <button className="modal-close" onClick={() => setShowAutoBidSetup(false)}>
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <p>Set your maximum bid amount. We'll automatically bid for you when others bid higher.</p>
                <div className="form-group">
                  <label htmlFor="maxBid">Maximum Bid Amount:</label>
                  <input
                    type="number"
                    id="maxBid"
                    min={displayCurrentPrice + 1}
                    step="1"
                    value={autoBidAmount || ''}
                    onChange={(e) => setAutoBidAmount(parseInt(e.target.value) || 0)}
                    placeholder="Enter maximum amount"
                  />
                </div>
                <div className="modal-buttons">
                  <button 
                    className="btn-outline" 
                    onClick={() => setShowAutoBidSetup(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={handleSetupAutoBid}
                    disabled={autoBidAmount <= displayCurrentPrice}
                  >
                    Setup Auto-Bid
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .auction-detail {
          padding: 2rem 0;
        }

        .connection-status {
          margin-bottom: 1rem;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 14px;
        }

        .status-connected {
          background: #d1fae5;
          color: #047857;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-disconnected {
          background: #fef3c7;
          color: #92400e;
        }

        .live-badge {
          background: #dc2626;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }

        .notification-banner {
          background: #dbeafe;
          color: #1e40af;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .auction-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-top: 1rem;
        }

        .auction-images .main-image {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
        }

        .auction-images img {
          width: 100%;
          height: 400px;
          object-fit: cover;
        }

        .auction-badges {
          position: absolute;
          top: 1rem;
          left: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }

        .badge.active {
          background: #10b981;
          color: white;
        }

        .badge.ending-soon {
          background: #f59e0b;
          color: white;
        }

        .badge.ended {
          background: #6b7280;
          color: white;
        }

        .badge.reserve-met {
          background: #3b82f6;
          color: white;
        }

        .bidding-section {
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: 12px;
          margin: 1rem 0;
        }

        .current-bid h2 {
          margin: 0 0 0.5rem 0;
          color: #374151;
        }

        .bid-amount {
          font-size: 2.5rem;
          font-weight: bold;
          color: #059669;
          margin-bottom: 0.5rem;
        }

        .bid-details {
          color: #6b7280;
          font-size: 14px;
        }

        .time-remaining {
          margin: 1rem 0;
        }

        .countdown {
          font-size: 1.5rem;
          font-weight: bold;
          color: #dc2626;
        }

        .bidding-controls {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .bidding-controls button {
          flex: 1;
        }

        .bid-status {
          margin-top: 1rem;
          padding: 0.75rem;
          border-radius: 8px;
          font-weight: 500;
        }

        .bid-status.confirmed {
          background: #d1fae5;
          color: #047857;
        }

        .bid-status.rejected {
          background: #fee2e2;
          color: #dc2626;
        }

        .recent-bids-section {
          margin: 1.5rem 0;
        }

        .bids-timeline {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }

        .bid-timeline-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #f3f4f6;
        }

        .bid-timeline-item:last-child {
          border-bottom: none;
        }

        .bid-info {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .bid-info .bid-amount {
          font-weight: bold;
          color: #059669;
        }

        .bid-info .bid-bidder {
          color: #6b7280;
        }

        .bid-time {
          font-size: 14px;
          color: #9ca3af;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .detail-item .label {
          color: #6b7280;
        }

        .detail-item .value {
          font-weight: 500;
          color: #374151;
        }

        @media (max-width: 768px) {
          .auction-content {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .bidding-controls {
            flex-direction: column;
          }

          .details-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default RealTimeAuction;
