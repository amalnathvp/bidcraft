import React, { useState } from 'react';
import BidModal from './BidModal';
import { AuctionItem } from '../types';

const AuctionsPage: React.FC = () => {
  const [selectedAuction, setSelectedAuction] = useState<AuctionItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('ending-soon');

  // Mock auction data
  const allAuctions: AuctionItem[] = [
    {
      id: '1',
      title: 'Handwoven Silk Carpet',
      artisan: 'Master Weaver Ahmad',
      currentBid: 1250,
      timeRemaining: '2h 45m',
      bidCount: 23,
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      isLive: true
    },
    {
      id: '2',
      title: 'Hand-carved Wooden Bowl Set',
      artisan: 'Maria Santos',
      currentBid: 380,
      timeRemaining: '1h 15m',
      bidCount: 12,
      imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
      isLive: true
    },
    {
      id: '3',
      title: 'Ceramic Vase Collection',
      artisan: 'Yuki Tanaka',
      currentBid: 650,
      timeRemaining: '5h 30m',
      bidCount: 18,
      imageUrl: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=400',
      isLive: true
    },
    {
      id: '4',
      title: 'Sterling Silver Jewelry Set',
      artisan: 'Elena Rodriguez',
      currentBid: 420,
      timeRemaining: '45m',
      bidCount: 31,
      imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400',
      isLive: true
    },
    {
      id: '5',
      title: 'Traditional Kilim Rug',
      artisan: 'Hassan Al-Rashid',
      currentBid: 890,
      timeRemaining: '3h 20m',
      bidCount: 15,
      imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
      isLive: true
    },
    {
      id: '6',
      title: 'Hand-blown Glass Sculpture',
      artisan: 'David Chen',
      currentBid: 1100,
      timeRemaining: '6h 10m',
      bidCount: 9,
      imageUrl: 'https://images.unsplash.com/photo-1578662015928-bee0badb2f10?w=400',
      isLive: true
    },
    {
      id: '7',
      title: 'Leather Handbag Collection',
      artisan: 'Isabella Rossi',
      currentBid: 320,
      timeRemaining: 'Ended',
      bidCount: 28,
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
      isLive: false
    },
    {
      id: '8',
      title: 'Bronze Sculpture Art',
      artisan: 'Michael Thompson',
      currentBid: 2200,
      timeRemaining: '4h 55m',
      bidCount: 7,
      imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
      isLive: true
    }
  ];

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'textiles', label: 'Textiles' },
    { value: 'woodwork', label: 'Woodwork' },
    { value: 'ceramics', label: 'Ceramics' },
    { value: 'jewelry', label: 'Jewelry' },
    { value: 'glass', label: 'Glass' },
    { value: 'leather', label: 'Leather' },
    { value: 'metal', label: 'Metal' }
  ];

  const sortOptions = [
    { value: 'ending-soon', label: 'Ending Soon' },
    { value: 'newest', label: 'Newest' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' }
  ];

  // Filter and sort auctions
  const filteredAndSortedAuctions = allAuctions
    .filter(auction => {
      const matchesSearch = auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           auction.artisan.toLowerCase().includes(searchTerm.toLowerCase());
      // For now, ignore category filtering since it's not in the AuctionItem type
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'ending-soon':
          // Sort by time remaining - items ending soon first
          if (a.timeRemaining.includes('h') && b.timeRemaining.includes('m') && !b.timeRemaining.includes('h')) return 1;
          if (b.timeRemaining.includes('h') && a.timeRemaining.includes('m') && !a.timeRemaining.includes('h')) return -1;
          return 0;
        case 'price-low':
          return a.currentBid - b.currentBid;
        case 'price-high':
          return b.currentBid - a.currentBid;
        case 'popular':
          return b.bidCount - a.bidCount;
        default:
          return 0;
      }
    });

  const handleBidPlaced = (amount: number) => {
    if (selectedAuction) {
      console.log(`Bid placed: $${amount} on ${selectedAuction.title}`);
      setSelectedAuction(null);
    }
  };

  const getStatusBadge = (isLive: boolean, timeRemaining: string) => {
    if (!isLive || timeRemaining === 'Ended') {
      return <span className="status-badge ended">Ended</span>;
    }
    if (timeRemaining.includes('m') && !timeRemaining.includes('h')) {
      return <span className="status-badge ending-soon">Ending Soon</span>;
    }
    return <span className="status-badge active">Live</span>;
  };

  return (
    <div className="auctions-page">
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <h1>All Auctions</h1>
          <p>Discover unique handcrafted items from talented artisans around the world</p>
        </div>

        {/* Filters and Search */}
        <div className="auctions-filters">
          <div className="search-bar">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search auctions or artisans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-controls">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  Sort by: {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="results-info">
          <p>Showing {filteredAndSortedAuctions.length} of {allAuctions.length} auctions</p>
        </div>

        {/* Auctions Grid */}
        <div className="auctions-grid">
          {filteredAndSortedAuctions.map(auction => (
            <div key={auction.id} className={`auction-card ${auction.isLive ? 'active' : 'ended'}`}>
              <div className="card-image">
                <img src={auction.imageUrl} alt={auction.title} />
                <div className="card-overlay-top">
                  {getStatusBadge(auction.isLive, auction.timeRemaining)}
                  {auction.isLive && auction.timeRemaining !== 'Ended' && (
                    <div className="time-remaining">{auction.timeRemaining}</div>
                  )}
                </div>
              </div>
              
              <div className="card-content">
                <h3>{auction.title}</h3>
                <p className="artisan">by {auction.artisan}</p>
                
                <div className="bid-info">
                  <div className="bid-details">
                    <span className="current-bid">${auction.currentBid}</span>
                    <span className="bid-count">{auction.bidCount} bids</span>
                  </div>
                  
                  {auction.isLive && auction.timeRemaining !== 'Ended' ? (
                    <button 
                      className="btn-primary small"
                      onClick={() => setSelectedAuction(auction)}
                    >
                      Place Bid
                    </button>
                  ) : (
                    <button className="btn-outline small" disabled>
                      Auction Ended
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredAndSortedAuctions.length === 0 && (
          <div className="no-results">
            <i className="fas fa-search"></i>
            <h3>No auctions found</h3>
            <p>Try adjusting your search terms or filters</p>
          </div>
        )}
      </div>

      {/* Bid Modal */}
      {selectedAuction && (
        <BidModal
          item={selectedAuction}
          onClose={() => setSelectedAuction(null)}
          onSubmit={handleBidPlaced}
        />
      )}
    </div>
  );
};

export default AuctionsPage;
