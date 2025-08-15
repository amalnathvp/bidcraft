import React, { useState, useEffect } from 'react';
import { AuctionItem, BidFormData } from '../types';

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

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
          <form className="bid-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="bidAmount">Your bid amount:</label>
              <input
                type="number"
                id="bidAmount"
                min={item.currentBid + 1}
                step="1"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  amount: parseInt(e.target.value) || item.currentBid + 1 
                }))}
                placeholder="Enter your bid"
                required
                autoFocus
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
                />
                Set as maximum bid (auto-bid up to this amount)
              </label>
            </div>
            <div className="modal-buttons">
              <button type="button" className="btn-outline modal-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Place Bid
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BidModal;
