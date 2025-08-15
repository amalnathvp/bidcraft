import React, { useState } from 'react';
import { AuctionItem } from '../types';
import BidModal from './BidModal';

interface FeaturedAuctionsProps {
  onBidPlaced: (amount: number) => void;
  onViewAllAuctions?: () => void;
}

const FeaturedAuctions: React.FC<FeaturedAuctionsProps> = ({ onBidPlaced, onViewAllAuctions }) => {
  const [selectedItem, setSelectedItem] = useState<AuctionItem | null>(null);

  const auctionItems: AuctionItem[] = [
    {
      id: '1',
      title: 'Vintage Ceramic Vase',
      artisan: 'Maria Santos',
      currentBid: 125,
      bidCount: 12,
      timeRemaining: '2h 45m left',
      imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop',
      isLive: true
    },
    {
      id: '2',
      title: 'Carved Wooden Sculpture',
      artisan: 'John Craftsman',
      currentBid: 280,
      bidCount: 8,
      timeRemaining: '5h 12m left',
      imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=300&h=200&fit=crop',
      isLive: true
    },
    {
      id: '3',
      title: 'Traditional Handwoven Rug',
      artisan: 'Amira Hassan',
      currentBid: 450,
      bidCount: 15,
      timeRemaining: '1d 3h left',
      imageUrl: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=300&h=200&fit=crop',
      isLive: true
    }
  ];

  const handleBidClick = (item: AuctionItem) => {
    setSelectedItem(item);
  };

  const handleBidSubmit = (amount: number) => {
    if (selectedItem) {
      onBidPlaced(amount);
      setSelectedItem(null);
    }
  };

  return (
    <section id="auctions" className="featured-auctions">
      <div className="container">
        <div className="section-header">
          <h2>Live Auctions</h2>
          <p>Don't miss out on these exceptional pieces</p>
        </div>
        <div className="auctions-grid">
          {auctionItems.map((item) => (
            <div key={item.id} className="auction-card">
              <div className="card-image">
                <img src={item.imageUrl} alt={item.title} />
                <div className="time-remaining">{item.timeRemaining}</div>
              </div>
              <div className="card-content">
                <h3>{item.title}</h3>
                <p className="artisan">by {item.artisan}</p>
                <div className="bid-info">
                  <span className="current-bid">${item.currentBid}</span>
                  <span className="bid-count">{item.bidCount} bids</span>
                </div>
                <button 
                  className="btn-primary small"
                  onClick={() => handleBidClick(item)}
                >
                  Place Bid
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="section-footer">
          <button 
            className="btn-outline"
            onClick={onViewAllAuctions}
          >
            View All Auctions
          </button>
        </div>
      </div>
      
      {selectedItem && (
        <BidModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSubmit={handleBidSubmit}
        />
      )}
    </section>
  );
};

export default FeaturedAuctions;
