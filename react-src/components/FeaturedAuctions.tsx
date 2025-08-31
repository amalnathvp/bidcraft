import React, { useState } from 'react';
import { AuctionItem } from '../types';
import { useFeaturedAuctions } from '../hooks';
import { transformAuctionForDisplay, formatCurrency } from '../utils/auctionUtils';
import BidModal from './BidModal';

interface FeaturedAuctionsProps {
  onBidPlaced: (amount: number) => void;
}

const FeaturedAuctions: React.FC<FeaturedAuctionsProps> = ({ onBidPlaced }) => {
  const [selectedItem, setSelectedItem] = useState<AuctionItem | null>(null);
  const { auctions, loading, error } = useFeaturedAuctions();

  // Debug logging
  console.log('FeaturedAuctions Debug:', { auctions, loading, error });

  const handleBidClick = (item: AuctionItem) => {
    setSelectedItem(item);
  };

  const handleBidSubmit = (amount: number) => {
    if (selectedItem) {
      onBidPlaced(amount);
      setSelectedItem(null);
    }
  };

  if (loading) {
    return (
      <section id="auctions" className="featured-auctions">
        <div className="container">
          <div className="section-header">
            <h2>Live Auctions</h2>
            <p>Don't miss out on these exceptional pieces</p>
          </div>
          <div className="auctions-grid">
            {/* Loading skeleton */}
            {[...Array(3)].map((_, index) => (
              <div key={index} className="auction-card loading">
                <div className="card-image skeleton"></div>
                <div className="card-content">
                  <div className="skeleton-text"></div>
                  <div className="skeleton-text"></div>
                  <div className="skeleton-text"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="auctions" className="featured-auctions">
        <div className="container">
          <div className="section-header">
            <h2>Live Auctions</h2>
            <p>Don't miss out on these exceptional pieces</p>
          </div>
          <div className="error-message">
            <p>Failed to load auctions: {error}</p>
            <button onClick={() => window.location.reload()} className="btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="auctions" className="featured-auctions">
      <div className="container">
        <div className="section-header">
          <h2>Live Auctions</h2>
          <p>Don't miss out on these exceptional pieces</p>
        </div>
        <div className="auctions-grid">
          {auctions.slice(0, 6).map((auction) => {
            const displayAuction = transformAuctionForDisplay(auction);
            return (
              <div key={auction._id} className="auction-card">
                <div className="card-image">
                  <img src={displayAuction.imageUrl} alt={auction.title} />
                  <div className="time-remaining">{displayAuction.timeRemaining}</div>
                </div>
                <div className="card-content">
                  <h3>{auction.title}</h3>
                  <p className="artisan">by {displayAuction.artisan}</p>
                  <div className="bid-info">
                    <span className="current-bid">{formatCurrency(auction.currentPrice)}</span>
                    <span className="bid-count">{auction.totalBids} bids</span>
                  </div>
                  <button 
                    className="btn-primary small"
                    onClick={() => handleBidClick(auction)}
                    disabled={!displayAuction.isLive}
                  >
                    {displayAuction.isLive ? 'Place Bid' : 'Auction Ended'}
                  </button>
                </div>
              </div>
            );
          })}
          
          {/* Show message if no featured auctions */}
          {auctions.length === 0 && (
            <div className="no-auctions">
              <p>No featured auctions available at the moment.</p>
              <p>Check back soon for exciting new items!</p>
            </div>
          )}
        </div>
        <div className="section-footer">
          <button className="btn-outline">View All Auctions</button>
        </div>
      </div>
      
      {selectedItem && (
        <BidModal
          item={transformAuctionForDisplay(selectedItem)}
          onClose={() => setSelectedItem(null)}
          onSubmit={handleBidSubmit}
        />
      )}
    </section>
  );
};

export default FeaturedAuctions;
