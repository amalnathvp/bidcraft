import React, { useState } from 'react';

interface BuyerDashboardProps {
  onNavigate?: (page: string) => void;
  user?: any;
}

const BuyerDashboard: React.FC<BuyerDashboardProps> = ({ onNavigate, user }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for buyer dashboard
  const buyerStats = {
    activeBids: 12,
    watchlist: 28,
    wonAuctions: 15,
    totalSpent: 2850,
    savedSearches: 8,
    favoriteCategories: ['Textiles', 'Pottery'],
    memberSince: '2023',
    trustScore: 4.9
  };

  const activeBids = [
    {
      id: 1,
      title: "Vintage Kashmiri Pashmina Shawl",
      currentBid: 285,
      myBid: 285,
      highestBidder: true,
      timeLeft: "2d 14h",
      image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=200&fit=crop",
      startingBid: 150,
      bidCount: 8,
      reserve: "Met"
    },
    {
      id: 2,
      title: "Hand-carved Wooden Buddha Statue",
      currentBid: 195,
      myBid: 180,
      highestBidder: false,
      timeLeft: "1d 8h",
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=200&fit=crop",
      startingBid: 100,
      bidCount: 12,
      reserve: "Not Met"
    },
    {
      id: 3,
      title: "Traditional Rajasthani Mirror Work Bag",
      currentBid: 125,
      myBid: 125,
      highestBidder: true,
      timeLeft: "3d 2h",
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=200&fit=crop",
      startingBid: 75,
      bidCount: 6,
      reserve: "Met"
    }
  ];

  const watchlist = [
    {
      id: 1,
      title: "Antique Brass Ceremonial Lamp",
      currentBid: 220,
      timeLeft: "4d 12h",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop",
      watching: 15,
      condition: "Excellent"
    },
    {
      id: 2,
      title: "Handwoven Kilim Rug",
      currentBid: 350,
      timeLeft: "1d 6h",
      image: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=300&h=200&fit=crop",
      watching: 23,
      condition: "Very Good"
    },
    {
      id: 3,
      title: "Silver Filigree Jewelry Set",
      currentBid: 185,
      timeLeft: "2d 18h",
      image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&h=200&fit=crop",
      watching: 8,
      condition: "Mint"
    }
  ];

  const recentPurchases = [
    {
      id: 1,
      title: "Embroidered Silk Pillow Covers",
      finalPrice: 145,
      purchaseDate: "2025-08-10",
      status: "delivered",
      seller: "KashmirCrafts",
      rating: 5
    },
    {
      id: 2,
      title: "Ceramic Tea Set with Hand Painting",
      finalPrice: 189,
      purchaseDate: "2025-08-05",
      status: "shipped",
      seller: "PotteryMaster",
      tracking: "TRK789012345"
    },
    {
      id: 3,
      title: "Carved Jade Dragon Figurine",
      finalPrice: 275,
      purchaseDate: "2025-08-01",
      status: "delivered",
      seller: "AsianArtisans",
      rating: 4
    }
  ];

  const savedSearches = [
    { id: 1, query: "Kashmiri shawl", alerts: true, newItems: 3 },
    { id: 2, query: "Wooden sculptures under $200", alerts: true, newItems: 1 },
    { id: 3, query: "Silver jewelry", alerts: false, newItems: 7 },
    { id: 4, query: "Vintage pottery", alerts: true, newItems: 2 }
  ];

  const recommendations = [
    {
      id: 1,
      title: "Hand-painted Ceramic Vase",
      price: 125,
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=150&fit=crop",
      reason: "Based on your pottery purchases"
    },
    {
      id: 2,
      title: "Embroidered Wall Hanging",
      price: 95,
      image: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=200&h=150&fit=crop",
      reason: "Similar to your watchlist items"
    },
    {
      id: 3,
      title: "Carved Wooden Box",
      price: 165,
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=150&fit=crop",
      reason: "Trending in your favorite categories"
    }
  ];

  const renderOverview = () => (
    <div className="buyer-overview">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon active-bids">
            <i className="fas fa-gavel"></i>
          </div>
          <div className="stat-content">
            <h3>{buyerStats.activeBids}</h3>
            <p>Active Bids</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon watchlist">
            <i className="fas fa-heart"></i>
          </div>
          <div className="stat-content">
            <h3>{buyerStats.watchlist}</h3>
            <p>Watchlist Items</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon won">
            <i className="fas fa-trophy"></i>
          </div>
          <div className="stat-content">
            <h3>{buyerStats.wonAuctions}</h3>
            <p>Won Auctions</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon spent">
            <i className="fas fa-dollar-sign"></i>
          </div>
          <div className="stat-content">
            <h3>${buyerStats.totalSpent}</h3>
            <p>Total Spent</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h3>My Active Bids ({activeBids.length})</h3>
            <button className="btn-outline small" onClick={() => setActiveTab('bids')}>
              View All
            </button>
          </div>
          <div className="bids-list">
            {activeBids.slice(0, 3).map(bid => (
              <div key={bid.id} className="bid-item">
                <div className="bid-image">
                  <img src={bid.image} alt={bid.title} />
                  {bid.highestBidder && <span className="highest-badge">Highest Bid</span>}
                </div>
                <div className="bid-info">
                  <h4>{bid.title}</h4>
                  <div className="bid-details">
                    <span>Current: ${bid.currentBid}</span>
                    <span>My Bid: ${bid.myBid}</span>
                    <span className={`reserve ${bid.reserve.toLowerCase().replace(' ', '-')}`}>
                      Reserve: {bid.reserve}
                    </span>
                  </div>
                  <div className="time-remaining">
                    <i className="fas fa-clock"></i>
                    {bid.timeLeft} remaining
                  </div>
                </div>
                <div className="bid-actions">
                  <button className="btn-primary small">Increase Bid</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3>Recommendations</h3>
          </div>
          <div className="recommendations-list">
            {recommendations.map(item => (
              <div key={item.id} className="recommendation-item">
                <div className="rec-image">
                  <img src={item.image} alt={item.title} />
                </div>
                <div className="rec-info">
                  <h5>{item.title}</h5>
                  <p className="rec-price">${item.price}</p>
                  <p className="rec-reason">{item.reason}</p>
                </div>
                <button className="btn-outline small">View</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button 
            className="action-btn"
            onClick={() => onNavigate && onNavigate('auctions')}
          >
            <i className="fas fa-search"></i>
            <span>Browse Auctions</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => setActiveTab('watchlist')}
          >
            <i className="fas fa-heart"></i>
            <span>My Watchlist</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => setActiveTab('searches')}
          >
            <i className="fas fa-bell"></i>
            <span>Saved Searches</span>
          </button>
          <button className="action-btn">
            <i className="fas fa-headset"></i>
            <span>Get Help</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderBids = () => (
    <div className="bids-section">
      <div className="section-header">
        <h3>My Bids</h3>
        <div className="filter-buttons">
          <button className="filter-btn active">Active ({activeBids.length})</button>
          <button className="filter-btn">Won (15)</button>
          <button className="filter-btn">Lost (8)</button>
          <button className="filter-btn">Expired (3)</button>
        </div>
      </div>

      <div className="bids-grid">
        {activeBids.map(bid => (
          <div key={bid.id} className="bid-card">
            <div className="bid-image">
              <img src={bid.image} alt={bid.title} />
              <div className="bid-overlay">
                {bid.highestBidder ? (
                  <span className="status-badge winning">Winning</span>
                ) : (
                  <span className="status-badge outbid">Outbid</span>
                )}
              </div>
            </div>
            <div className="bid-content">
              <h4>{bid.title}</h4>
              <div className="bid-stats">
                <div className="current-bid">
                  <span className="label">Current Bid:</span>
                  <span className="amount">${bid.currentBid}</span>
                </div>
                <div className="my-bid">
                  <span className="label">My Bid:</span>
                  <span className="amount">${bid.myBid}</span>
                </div>
              </div>
              <div className="auction-info">
                <span>Starting: ${bid.startingBid}</span>
                <span>{bid.bidCount} bids</span>
                <span className={`reserve ${bid.reserve.toLowerCase().replace(' ', '-')}`}>
                  {bid.reserve}
                </span>
              </div>
              <div className="time-remaining">
                <i className="fas fa-clock"></i>
                {bid.timeLeft} remaining
              </div>
              <div className="bid-actions">
                <button className="btn-primary">
                  {bid.highestBidder ? 'Increase Bid' : 'Place Higher Bid'}
                </button>
                <button className="btn-outline">Watch Item</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderWatchlist = () => (
    <div className="watchlist-section">
      <div className="section-header">
        <h3>My Watchlist ({watchlist.length} items)</h3>
        <div className="watchlist-controls">
          <button className="btn-outline">Sort by Ending Soon</button>
          <button className="btn-primary">Create Alert</button>
        </div>
      </div>

      <div className="watchlist-grid">
        {watchlist.map(item => (
          <div key={item.id} className="watchlist-card">
            <div className="watch-image">
              <img src={item.image} alt={item.title} />
              <button className="remove-watch">
                <i className="fas fa-heart-broken"></i>
              </button>
            </div>
            <div className="watch-content">
              <h4>{item.title}</h4>
              <div className="watch-stats">
                <div className="current-bid">
                  <span>Current Bid: ${item.currentBid}</span>
                </div>
                <div className="watchers">
                  <i className="fas fa-eye"></i>
                  {item.watching} watching
                </div>
              </div>
              <div className="condition">
                Condition: {item.condition}
              </div>
              <div className="time-remaining">
                <i className="fas fa-clock"></i>
                {item.timeLeft} remaining
              </div>
              <div className="watch-actions">
                <button className="btn-primary">Place Bid</button>
                <button className="btn-outline">View Details</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPurchases = () => (
    <div className="purchases-section">
      <div className="section-header">
        <h3>My Purchases</h3>
        <div className="filter-buttons">
          <button className="filter-btn active">All</button>
          <button className="filter-btn">Delivered</button>
          <button className="filter-btn">In Transit</button>
          <button className="filter-btn">Pending</button>
        </div>
      </div>

      <div className="purchases-list">
        {recentPurchases.map(purchase => (
          <div key={purchase.id} className="purchase-card">
            <div className="purchase-header">
              <div className="purchase-info">
                <h4>{purchase.title}</h4>
                <p>Purchased from {purchase.seller} on {purchase.purchaseDate}</p>
              </div>
              <div className="purchase-amount">${purchase.finalPrice}</div>
            </div>
            <div className="purchase-status">
              <span className={`status-badge ${purchase.status}`}>
                {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
              </span>
              {purchase.tracking && (
                <span className="tracking">Tracking: {purchase.tracking}</span>
              )}
            </div>
            <div className="purchase-actions">
              {purchase.status === 'delivered' && !purchase.rating && (
                <button className="btn-primary small">Rate Seller</button>
              )}
              {purchase.rating && (
                <div className="rating-display">
                  {'★'.repeat(purchase.rating)}{'☆'.repeat(5 - purchase.rating)}
                </div>
              )}
              <button className="btn-outline small">View Details</button>
              <button className="btn-outline small">Contact Seller</button>
              {purchase.status === 'delivered' && (
                <button className="btn-outline small">Buy Similar</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSearches = () => (
    <div className="searches-section">
      <div className="section-header">
        <h3>Saved Searches & Alerts</h3>
        <button className="btn-primary">Create New Search</button>
      </div>

      <div className="searches-list">
        {savedSearches.map(search => (
          <div key={search.id} className="search-card">
            <div className="search-info">
              <h4>"{search.query}"</h4>
              <div className="search-stats">
                <span className={`alert-status ${search.alerts ? 'active' : 'inactive'}`}>
                  <i className={`fas fa-bell${search.alerts ? '' : '-slash'}`}></i>
                  {search.alerts ? 'Alerts On' : 'Alerts Off'}
                </span>
                {search.newItems > 0 && (
                  <span className="new-items">
                    {search.newItems} new item{search.newItems > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            <div className="search-actions">
              <button className="btn-outline small">View Results</button>
              <button className="btn-outline small">
                {search.alerts ? 'Turn Off Alerts' : 'Turn On Alerts'}
              </button>
              <button className="btn-outline small">Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="buyer-settings">
      <div className="settings-grid">
        <div className="settings-card">
          <h3>Bidding Preferences</h3>
          <form className="settings-form">
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                <span className="checkmark"></span>
                Enable automatic bidding
              </label>
            </div>
            <div className="form-group">
              <label>Default bid increment</label>
              <select defaultValue="smart">
                <option value="5">$5</option>
                <option value="10">$10</option>
                <option value="25">$25</option>
                <option value="smart">Smart increment</option>
              </select>
            </div>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                <span className="checkmark"></span>
                Confirm bids before placing
              </label>
            </div>
            <button className="btn-primary">Save Preferences</button>
          </form>
        </div>

        <div className="settings-card">
          <h3>Notifications</h3>
          <form className="settings-form">
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                <span className="checkmark"></span>
                Email when outbid
              </label>
            </div>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                <span className="checkmark"></span>
                Auction ending reminders
              </label>
            </div>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span className="checkmark"></span>
                Daily digest emails
              </label>
            </div>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                <span className="checkmark"></span>
                Push notifications on mobile
              </label>
            </div>
            <button className="btn-primary">Update Notifications</button>
          </form>
        </div>

        <div className="settings-card">
          <h3>Payment Methods</h3>
          <div className="payment-methods">
            <div className="payment-method">
              <i className="fab fa-cc-visa"></i>
              <span>**** **** **** 1234</span>
              <button className="btn-outline small">Edit</button>
            </div>
            <div className="payment-method">
              <i className="fab fa-paypal"></i>
              <span>buyer@example.com</span>
              <button className="btn-outline small">Edit</button>
            </div>
          </div>
          <button className="btn-primary">Add Payment Method</button>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-chart-pie' },
    { id: 'bids', label: 'My Bids', icon: 'fas fa-gavel' },
    { id: 'watchlist', label: 'Watchlist', icon: 'fas fa-heart' },
    { id: 'purchases', label: 'Purchases', icon: 'fas fa-shopping-bag' },
    { id: 'searches', label: 'Saved Searches', icon: 'fas fa-search' },
    { id: 'settings', label: 'Settings', icon: 'fas fa-cog' }
  ];

  return (
    <div className="buyer-dashboard">
      <div className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <div className="buyer-info">
              <div className="buyer-avatar">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face" alt="Buyer" />
              </div>
              <div className="buyer-details">
                <h1>Welcome back, {user?.name || 'Collector'}!</h1>
                <p>Member since {buyerStats.memberSince} • Trust Score: ⭐ {buyerStats.trustScore}</p>
              </div>
            </div>
            <div className="header-actions">
              <button 
                className="btn-primary"
                onClick={() => onNavigate && onNavigate('auctions')}
              >
                <i className="fas fa-search"></i>
                Browse Auctions
              </button>
              <button className="btn-outline">
                <i className="fas fa-bell"></i>
                Alerts ({buyerStats.savedSearches})
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-nav">
        <div className="container">
          <div className="nav-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <i className={tab.icon}></i>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="container">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'bids' && renderBids()}
          {activeTab === 'watchlist' && renderWatchlist()}
          {activeTab === 'purchases' && renderPurchases()}
          {activeTab === 'searches' && renderSearches()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;
