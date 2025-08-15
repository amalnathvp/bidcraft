import React, { useState } from 'react';

interface LiveAuctionsProps {
  onNavigate?: (page: string, data?: any) => void;
}

const LiveAuctions: React.FC<LiveAuctionsProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('ending-soon');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { id: 'all', label: 'All Categories', count: 156 },
    { id: 'textiles', label: 'Textiles', count: 42 },
    { id: 'pottery', label: 'Pottery & Ceramics', count: 28 },
    { id: 'jewelry', label: 'Jewelry', count: 35 },
    { id: 'woodwork', label: 'Woodwork', count: 24 },
    { id: 'metalwork', label: 'Metalwork', count: 18 },
    { id: 'paintings', label: 'Paintings', count: 15 },
    { id: 'sculptures', label: 'Sculptures', count: 12 }
  ];

  const liveAuctions = [
    {
      id: '1',
      title: 'Vintage Kashmiri Pashmina Shawl',
      category: 'textiles',
      currentBid: 285,
      startingBid: 150,
      bidCount: 8,
      timeLeft: '2d 14h 32m',
      endTime: '2025-08-18 18:30:00',
      image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=300&fit=crop',
      seller: 'KashmirCrafts',
      condition: 'Excellent',
      isHot: true,
      reserveMet: true,
      watchers: 15
    },
    {
      id: '2',
      title: 'Hand-carved Wooden Buddha Statue',
      category: 'woodwork',
      currentBid: 195,
      startingBid: 100,
      bidCount: 12,
      timeLeft: '1d 8h 45m',
      endTime: '2025-08-17 12:45:00',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
      seller: 'WoodMaster',
      condition: 'Very Good',
      isHot: false,
      reserveMet: false,
      watchers: 23
    },
    {
      id: '3',
      title: 'Traditional Rajasthani Mirror Work Bag',
      category: 'textiles',
      currentBid: 125,
      startingBid: 75,
      bidCount: 6,
      timeLeft: '3d 2h 15m',
      endTime: '2025-08-19 08:15:00',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop',
      seller: 'RajasthanArts',
      condition: 'Mint',
      isHot: true,
      reserveMet: true,
      watchers: 8
    },
    {
      id: '4',
      title: 'Antique Brass Ceremonial Lamp',
      category: 'metalwork',
      currentBid: 220,
      startingBid: 120,
      bidCount: 15,
      timeLeft: '4d 12h 20m',
      endTime: '2025-08-20 18:20:00',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
      seller: 'BrassArtisans',
      condition: 'Good',
      isHot: false,
      reserveMet: true,
      watchers: 19
    },
    {
      id: '5',
      title: 'Handwoven Kilim Rug',
      category: 'textiles',
      currentBid: 350,
      startingBid: 200,
      bidCount: 22,
      timeLeft: '1d 6h 10m',
      endTime: '2025-08-17 10:10:00',
      image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=300&fit=crop',
      seller: 'RugMasters',
      condition: 'Excellent',
      isHot: true,
      reserveMet: true,
      watchers: 31
    },
    {
      id: '6',
      title: 'Silver Filigree Jewelry Set',
      category: 'jewelry',
      currentBid: 185,
      startingBid: 100,
      bidCount: 9,
      timeLeft: '2d 18h 45m',
      endTime: '2025-08-19 00:45:00',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop',
      seller: 'SilverCrafts',
      condition: 'Mint',
      isHot: false,
      reserveMet: false,
      watchers: 12
    },
    {
      id: '7',
      title: 'Blue Pottery Dinner Set',
      category: 'pottery',
      currentBid: 165,
      startingBid: 90,
      bidCount: 11,
      timeLeft: '5d 4h 30m',
      endTime: '2025-08-21 10:30:00',
      image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=300&fit=crop',
      seller: 'PotteryHouse',
      condition: 'Very Good',
      isHot: false,
      reserveMet: true,
      watchers: 16
    },
    {
      id: '8',
      title: 'Carved Jade Dragon Figurine',
      category: 'sculptures',
      currentBid: 275,
      startingBid: 150,
      bidCount: 18,
      timeLeft: '3d 22h 05m',
      endTime: '2025-08-20 04:05:00',
      image: 'https://images.unsplash.com/photo-1612198084106-c7dbb33a4e53?w=400&h=300&fit=crop',
      seller: 'JadeArtists',
      condition: 'Excellent',
      isHot: true,
      reserveMet: true,
      watchers: 25
    }
  ];

  const featuredAuctions = liveAuctions.filter(auction => auction.isHot).slice(0, 3);
  const endingSoon = liveAuctions.sort((a, b) => {
    const timeA = parseFloat(a.timeLeft.split('d')[0]);
    const timeB = parseFloat(b.timeLeft.split('d')[0]);
    return timeA - timeB;
  }).slice(0, 4);

  const filteredAuctions = liveAuctions.filter(auction => {
    const matchesCategory = selectedCategory === 'all' || auction.category === selectedCategory;
    const matchesSearch = auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         auction.seller.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = (!priceRange.min || auction.currentBid >= parseInt(priceRange.min)) &&
                        (!priceRange.max || auction.currentBid <= parseInt(priceRange.max));
    return matchesCategory && matchesSearch && matchesPrice;
  });

  const sortedAuctions = [...filteredAuctions].sort((a, b) => {
    switch (sortBy) {
      case 'ending-soon':
        return parseFloat(a.timeLeft.split('d')[0]) - parseFloat(b.timeLeft.split('d')[0]);
      case 'price-low':
        return a.currentBid - b.currentBid;
      case 'price-high':
        return b.currentBid - a.currentBid;
      case 'most-bids':
        return b.bidCount - a.bidCount;
      case 'newest':
        return new Date(b.endTime).getTime() - new Date(a.endTime).getTime();
      default:
        return 0;
    }
  });

  const handleAuctionClick = (auction: any) => {
    onNavigate && onNavigate('auction-detail', { auctionId: auction.id });
  };

  const formatTimeLeft = (timeString: string) => {
    const parts = timeString.split(' ');
    return (
      <div className="time-display">
        {parts.map((part, index) => (
          <span key={index} className={`time-part ${part.includes('d') ? 'days' : part.includes('h') ? 'hours' : 'minutes'}`}>
            {part}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="live-auctions">
      <div className="auctions-hero">
        <div className="container">
          <div className="hero-content">
            <h1>Live Auctions</h1>
            <p>Discover unique handicrafts from artisans around the world</p>
            <div className="auction-stats">
              <div className="stat">
                <span className="number">{liveAuctions.length}</span>
                <span className="label">Active Auctions</span>
              </div>
              <div className="stat">
                <span className="number">{endingSoon.length}</span>
                <span className="label">Ending Soon</span>
              </div>
              <div className="stat">
                <span className="number">{featuredAuctions.length}</span>
                <span className="label">Hot Items</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="search-filters">
          <div className="search-bar">
            <div className="search-input-group">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search auctions, sellers, or items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              className="filter-toggle"
              onClick={() => setShowFilters(!showFilters)}
            >
              <i className="fas fa-filter"></i>
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="filters-panel">
              <div className="filter-group">
                <label>Price Range</label>
                <div className="price-inputs">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                  />
                  <span>to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                  />
                </div>
              </div>
              <div className="filter-group">
                <label>Sort By</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="ending-soon">Ending Soon</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="most-bids">Most Bids</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="categories-nav">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.label} ({category.count})
            </button>
          ))}
        </div>

        <div className="featured-section">
          <h2>🔥 Hot Auctions</h2>
          <div className="featured-grid">
            {featuredAuctions.map(auction => (
              <div key={auction.id} className="featured-card" onClick={() => handleAuctionClick(auction)}>
                <div className="featured-image">
                  <img src={auction.image} alt={auction.title} />
                  <div className="featured-overlay">
                    <span className="hot-badge">🔥 HOT</span>
                    <div className="watchers">
                      <i className="fas fa-eye"></i>
                      {auction.watchers}
                    </div>
                  </div>
                </div>
                <div className="featured-content">
                  <h3>{auction.title}</h3>
                  <div className="featured-stats">
                    <div className="current-bid">
                      <span className="label">Current Bid:</span>
                      <span className="amount">${auction.currentBid}</span>
                    </div>
                    <div className="bid-count">{auction.bidCount} bids</div>
                  </div>
                  <div className="time-remaining">
                    {formatTimeLeft(auction.timeLeft)}
                  </div>
                  <button className="btn-primary">Place Bid</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ending-soon-section">
          <h2>⏰ Ending Soon</h2>
          <div className="ending-soon-grid">
            {endingSoon.map(auction => (
              <div key={auction.id} className="ending-soon-card" onClick={() => handleAuctionClick(auction)}>
                <div className="card-image">
                  <img src={auction.image} alt={auction.title} />
                  <div className="time-badge">
                    {auction.timeLeft.split(' ')[0]}
                  </div>
                </div>
                <div className="card-content">
                  <h4>{auction.title}</h4>
                  <div className="price-info">
                    <span className="current-bid">${auction.currentBid}</span>
                    <span className="bid-count">({auction.bidCount} bids)</span>
                  </div>
                  <div className="seller">by {auction.seller}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="all-auctions-section">
          <div className="section-header">
            <h2>All Auctions ({sortedAuctions.length})</h2>
            <div className="view-controls">
              <button className="view-btn grid active">
                <i className="fas fa-th"></i>
              </button>
              <button className="view-btn list">
                <i className="fas fa-list"></i>
              </button>
            </div>
          </div>

          <div className="auctions-grid">
            {sortedAuctions.map(auction => (
              <div key={auction.id} className="auction-card" onClick={() => handleAuctionClick(auction)}>
                <div className="card-image">
                  <img src={auction.image} alt={auction.title} />
                  <div className="image-overlay">
                    {auction.isHot && <span className="hot-badge">🔥</span>}
                    <button className="watchlist-btn">
                      <i className="far fa-heart"></i>
                    </button>
                    <div className="condition-badge">{auction.condition}</div>
                  </div>
                </div>
                <div className="card-content">
                  <div className="auction-header">
                    <h3>{auction.title}</h3>
                    <span className="category-tag">{auction.category}</span>
                  </div>
                  <div className="seller-info">
                    <span>by {auction.seller}</span>
                  </div>
                  <div className="bid-info">
                    <div className="current-bid">
                      <span className="label">Current Bid:</span>
                      <span className="amount">${auction.currentBid}</span>
                    </div>
                    <div className="bid-stats">
                      <span>{auction.bidCount} bids</span>
                      <span className={`reserve ${auction.reserveMet ? 'met' : 'not-met'}`}>
                        Reserve {auction.reserveMet ? 'Met' : 'Not Met'}
                      </span>
                    </div>
                  </div>
                  <div className="time-remaining">
                    <i className="fas fa-clock"></i>
                    {formatTimeLeft(auction.timeLeft)}
                  </div>
                  <div className="watchers-count">
                    <i className="fas fa-eye"></i>
                    {auction.watchers} watching
                  </div>
                  <div className="card-actions">
                    <button className="btn-primary">Place Bid</button>
                    <button className="btn-outline">Watch</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="auction-tips">
          <h3>Bidding Tips</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <i className="fas fa-clock"></i>
              <h4>Time Your Bids</h4>
              <p>Consider bidding in the final moments for the best chance of winning</p>
            </div>
            <div className="tip-card">
              <i className="fas fa-search"></i>
              <h4>Research Items</h4>
              <p>Check the item description, condition, and seller rating before bidding</p>
            </div>
            <div className="tip-card">
              <i className="fas fa-dollar-sign"></i>
              <h4>Set a Budget</h4>
              <p>Decide your maximum bid beforehand and stick to it</p>
            </div>
            <div className="tip-card">
              <i className="fas fa-heart"></i>
              <h4>Use Watchlist</h4>
              <p>Save items you're interested in to track their progress</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveAuctions;
