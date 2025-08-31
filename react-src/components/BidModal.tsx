import React, { useState, useEffect } from 'react';
import { LegacyAuctionItem, BidFormData } from '../types';
import { bidService } from '../services/bidService';

interface BidModalProps {
  item: LegacyAuctionItem;
  onClose: () => void;
  onSubmit: (amount: number) => void;
}

const BidModal: React.FC<BidModalProps> = ({ item, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<BidFormData>({
    amount: item.currentBid + 1,
    isMaxBid: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.amount <= item.currentBid) {
      setError(`Bid must be higher than current bid of $${item.currentBid}`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      // Attempt to place bid through API
      const bidData = {
        amount: formData.amount,
        isMaxBid: formData.isMaxBid,
        maxBidAmount: formData.isMaxBid ? formData.amount : undefined
      };
      
      await bidService.placeBid(item.id, bidData);
      onSubmit(formData.amount);
      
    } catch (err) {
      console.error('Failed to place bid:', err);
      setError(err instanceof Error ? err.message : 'Failed to place bid. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <h4>{item.title}</h4>
          <p>Current bid: <span className="current-bid-modal">${item.currentBid}</span></p>
          
          {error && (
            <div className="error-message">
              <p style={{ color: 'red', margin: '10px 0' }}>{error}</p>
            </div>
          )}
          
          <form className="bid-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="bidAmount">Your bid amount:</label>
              <input
                type="number"
                id="bidAmount"
                min={item.currentBid + 1}
                step="1"
                value={formData.amount}
                onChange={(e) => {
                  setError(null);
                  setFormData(prev => ({ 
                    ...prev, 
                    amount: parseInt(e.target.value) || item.currentBid + 1 
                  }));
                }}
                placeholder="Enter your bid"
                required
                autoFocus
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isMaxBid}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    isMaxBid: e.target.checked 
                  }))}
                  disabled={isSubmitting}
                />
                Set as maximum bid (auto-bid up to this amount)
              </label>
            </div>
            <div className="modal-buttons">
              <button 
                type="button" 
                className="btn-outline modal-cancel" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className={`btn-primary ${isSubmitting ? 'loading' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Placing Bid...' : 'Place Bid'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BidModal;
