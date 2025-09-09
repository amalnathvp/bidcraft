import React, { useState, useEffect } from 'react';
import { AuctionItem, BidFormData } from '../types';
import { useLiveBidding } from '../hooks/useSocket';
import '../styles/BidModal.css';

interface BidModalProps {
  item: AuctionItem;
  onClose: () => void;
  onSubmit: (amount: number) => void;
}

const BidModal: React.FC<BidModalProps> = ({ item, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<BidFormData>({
    amount: item.currentBid + 1,
    isMaxBid: false
  });

  // Real-time bidding hooks
  const {
    isInLiveRoom,
    currentBid,
    totalBids,
    recentBids,
    leadingBidder,
    bidStatus,
    bidError,
    placeBid,
    setupAutoBid
  } = useLiveBidding(item.id);

  // Update form when current bid changes from real-time updates
  useEffect(() => {
    if (currentBid > 0) {
      setFormData(prev => ({
        ...prev,
        amount: Math.max(prev.amount, currentBid + 1)
      }));
    }
  }, [currentBid]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.isMaxBid) {
      // Setup auto-bidding
      setupAutoBid(formData.amount);
    } else {
      // Place manual bid
      placeBid(formData.amount, 'manual');
    }
    
    // Also call the original onSubmit for backward compatibility
    onSubmit(formData.amount);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Use real-time data if available, fallback to props
  const displayCurrentBid = currentBid > 0 ? currentBid : item.currentBid;
  const displayTotalBids = totalBids > 0 ? totalBids : 0;

  return (
    <div 
      className="modal-overlay" 
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h3>Place Your Bid</h3>
          <div className="live-status">
            {isInLiveRoom ? (
              <span className="live-indicator">🔴 LIVE</span>
            ) : (
              <span className="offline-indicator">📍 Standard</span>
            )}
          </div>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        
        <div className="modal-body">
          <h4>{item.title}</h4>
          
          {/* Real-time bid information */}
          <div className="bid-info-section">
            <div className="current-bid-info">
              <p>Current bid: <span className="current-bid-modal">${displayCurrentBid}</span></p>
              {displayTotalBids > 0 && (
                <p className="bid-count">({displayTotalBids} bids placed)</p>
              )}
              {leadingBidder && (
                <p className="leading-bidder">Leading: {leadingBidder.name}</p>
              )}
            </div>
            
            {/* Real-time status indicators */}
            {bidStatus === 'placing' && (
              <div className="bid-status placing">
                <div className="spinner"></div>
                Placing bid...
              </div>
            )}
            {bidStatus === 'confirmed' && (
              <div className="bid-status confirmed">
                ✅ Bid confirmed!
              </div>
            )}
            {bidStatus === 'rejected' && bidError && (
              <div className="bid-status rejected">
                ❌ {bidError}
              </div>
            )}
          </div>

          {/* Recent bids display */}
          {recentBids.length > 0 && (
            <div className="recent-bids">
              <h5>Recent Bids</h5>
              <div className="bids-list">
                {recentBids.slice(0, 3).map((bid, index) => (
                  <div key={index} className="bid-item">
                    <span className="bid-amount">${bid.amount}</span>
                    <span className="bid-bidder">{bid.bidder.name}</span>
                    <span className="bid-time">
                      {new Date(bid.bidTime).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <form className="bid-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="bidAmount">Your bid amount:</label>
              <input
                type="number"
                id="bidAmount"
                min={displayCurrentBid + 1}
                step="1"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  amount: parseInt(e.target.value) || displayCurrentBid + 1 
                }))}
                placeholder="Enter your bid"
                required
                autoFocus
                disabled={bidStatus === 'placing'}
              />
              <div className="bid-suggestions">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, amount: displayCurrentBid + 1 }))}
                  className="suggestion-btn"
                >
                  +$1
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, amount: displayCurrentBid + 5 }))}
                  className="suggestion-btn"
                >
                  +$5
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, amount: displayCurrentBid + 10 }))}
                  className="suggestion-btn"
                >
                  +$10
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isMaxBid}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    isMaxBid: e.target.checked 
                  }))}
                />
                <span className="checkmark"></span>
                Set as maximum bid (auto-bid up to this amount)
              </label>
              {formData.isMaxBid && (
                <p className="auto-bid-info">
                  💡 We'll automatically bid for you up to this amount when others bid higher
                </p>
              )}
            </div>
            
            <div className="modal-buttons">
              <button 
                type="button" 
                className="btn-outline modal-cancel" 
                onClick={onClose}
                disabled={bidStatus === 'placing'}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={bidStatus === 'placing' || formData.amount <= displayCurrentBid}
              >
                {bidStatus === 'placing' ? (
                  <>
                    <div className="spinner-small"></div>
                    Placing...
                  </>
                ) : formData.isMaxBid ? (
                  'Set Auto-Bid'
                ) : (
                  'Place Bid'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      

    </div>
  );
};

export default BidModal;
