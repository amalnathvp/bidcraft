import React, { useState, useEffect } from 'react';
import '../styles/ListNewItemPage.css';
import { auctionService } from '../services/auctionService';
import { AuctionItem } from '../types';
import { getCategoryName } from '../utils/categoryUtils';

interface SellerDashboardProps {
  onNavigate?: (page: string) => void;
  user?: any;
}

const SellerDashboard: React.FC<SellerDashboardProps> = ({ onNavigate, user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showListingModal, setShowListingModal] = useState(false);
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch seller's auctions
  const fetchSellerAuctions = async () => {
    try {
      console.log('🚀 Fetching seller auctions...');
      setLoading(true);
      setError(null);
      const response = await auctionService.getMyAuctions();
      
      console.log('📥 Auction service response:', response);
      
      if (response.success && response.data) {
        console.log('✅ Successfully fetched auctions:', response.data.length);
        setAuctions(response.data);
      } else {
        console.log('❌ Failed to fetch auctions:', response.message);
        setError(response.message || 'Failed to fetch auctions');
      }
    } catch (err) {
      console.error('💥 Error fetching seller auctions:', err);
      setError('Failed to load your auctions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch auctions on component mount
  useEffect(() => {
    console.log('🔄 useEffect triggered. User:', user);
    console.log('🔐 Is authenticated:', user?.isAuthenticated);
    
    // Always try to fetch auctions, even for demo users
    fetchSellerAuctions();
  }, [user?.isAuthenticated]);

  // Calculate stats from real auction data
  const sellerStats = React.useMemo(() => {
    console.log('🔍 Calculating seller stats with auctions:', auctions.length);
    
    const activeAuctions = auctions.filter(auction => {
      const endTime = new Date(auction.endTime || '');
      return endTime > new Date();
    }).length;

    const soldItems = auctions.filter(auction => {
      const endTime = new Date(auction.endTime || '');
      return endTime <= new Date() && auction.bidCount > 0;
    }).length;

    const totalRevenue = auctions
      .filter(auction => {
        const endTime = new Date(auction.endTime || '');
        return endTime <= new Date() && auction.bidCount > 0;
      })
      .reduce((sum, auction) => sum + (auction.currentBid || 0), 0);

    const averagePrice = soldItems > 0 ? Math.round(totalRevenue / soldItems) : 0;
    const successRate = auctions.length > 0 ? Math.round((soldItems / auctions.length) * 100) : 0;

    const stats = {
      totalListings: auctions.length,
      activeAuctions,
      soldItems,
      totalRevenue: Math.round(totalRevenue),
      averagePrice,
      successRate,
      rating: 4.8, // This would come from user profile
      followers: 342 // This would come from user profile
    };

    console.log('📊 Calculated seller stats:', stats);
    return stats;
  }, [auctions]);

  // Get recent auctions created by seller from database
  const recentAuctions = React.useMemo(() => {
    const sellerAuctions = auctions
      .sort((a, b) => new Date(b.endTime || '').getTime() - new Date(a.endTime || '').getTime())
      .slice(0, 5)
      .map(auction => ({
        id: auction.id,
        title: auction.title,
        currentBid: auction.currentBid,
        startingBid: auction.startingBid || auction.currentBid,
        createdDate: new Date(auction.endTime || '').toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        image: auction.imageUrl || auction.image,
        category: getCategoryName(auction.category),
        bidCount: auction.bidCount,
        status: new Date(auction.endTime || '') > new Date() ? 'active' : 'ended'
      }));

    console.log('🏺 Recent auctions calculated:', sellerAuctions);
    return sellerAuctions;
  }, [auctions]);

  // Get active listings from real auction data
  const activeListings = React.useMemo(() => {
    const now = new Date();
    return auctions
      .filter(auction => {
        const endTime = new Date(auction.endTime || '');
        return endTime > now;
      })
      .map(auction => {
        const endTime = new Date(auction.endTime || '');
        const timeDiff = endTime.getTime() - now.getTime();
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        let timeLeft = '';
        if (days > 0) {
          timeLeft = `${days}d ${hours}h`;
        } else if (hours > 0) {
          timeLeft = `${hours}h`;
        } else {
          const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
          timeLeft = `${minutes}m`;
        }

        return {
          id: auction.id,
          title: auction.title,
          currentBid: auction.currentBid,
          startingBid: auction.startingBid || auction.currentBid,
          timeLeft,
          watchers: auction.watchers || 0,
          bidCount: auction.bidCount,
          status: auction.bidCount > 0 ? "active" : "scheduled"
        };
      });
  }, [auctions]);

  const draftListings = [
    {
      id: 1,
      title: "Traditional Pottery Vase",
      category: "Pottery & Ceramics",
      createdDate: "2025-08-14",
      completeness: 85
    },
    {
      id: 2,
      title: "Handwoven Bamboo Basket",
      category: "Home Decor",
      createdDate: "2025-08-13",
      completeness: 60
    }
  ];

  const orders = [
    {
      id: "ORD-001",
      item: "Handwoven Kashmiri Pashmina Shawl",
      buyer: "collector123",
      amount: 340,
      status: "shipped",
      orderDate: "2025-08-12",
      shippingAddress: "123 Main St, New York, NY 10001",
      trackingNumber: "TRK123456789"
    },
    {
      id: "ORD-002",
      item: "Traditional Rajasthani Miniature Painting",
      buyer: "artlover89",
      amount: 275,
      status: "processing",
      orderDate: "2025-08-10",
      shippingAddress: "456 Oak Ave, Los Angeles, CA 90210",
      trackingNumber: null
    }
  ];

  const earnings = {
    thisMonth: 1250,
    lastMonth: 980,
    thisYear: 3420,
    pendingPayouts: 185,
    availableBalance: 1065,
    nextPayout: "2025-08-18"
  };

  const renderOverview = () => (
    <div className="dashboard-overview">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-box"></i>
          </div>
          <div className="stat-content">
            <h3>{loading ? '...' : sellerStats.totalListings || 0}</h3>
            <p>Total Listings</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <i className="fas fa-gavel"></i>
          </div>
          <div className="stat-content">
            <h3>{loading ? '...' : sellerStats.activeAuctions || 0}</h3>
            <p>Active Auctions</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon sold">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <h3>{loading ? '...' : sellerStats.soldItems || 0}</h3>
            <p>Items Sold</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon revenue">
            <i className="fas fa-dollar-sign"></i>
          </div>
          <div className="stat-content">
            <h3>{loading ? '...' : `$${sellerStats.totalRevenue || 0}`}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Recent Auctions</h3>
            <button className="btn-outline small">View All</button>
          </div>
          <div className="sales-list">
            {loading && (
              <div className="loading-placeholder">
                <i className="fas fa-spinner fa-spin"></i>
                <span>Loading your auctions...</span>
              </div>
            )}
            {!loading && recentAuctions.length === 0 && (
              <div className="empty-sales">
                <i className="fas fa-gavel"></i>
                <p>No auctions yet. Your created auctions will appear here.</p>
              </div>
            )}
            {!loading && recentAuctions.map(auction => (
              <div key={auction.id} className="sale-item">
                <div className="sale-image">
                  <img 
                    src={auction.image || `https://images.unsplash.com/photo-1500000000000?w=60&h=60&fit=crop`} 
                    alt={auction.title}
                    className="sale-thumbnail"
                  />
                </div>
                <div className="sale-info">
                  <h4>{auction.title}</h4>
                  <p>Created on {auction.createdDate} • {auction.status}</p>
                  <span className="sale-meta">
                    {auction.bidCount} bids • {auction.category}
                  </span>
                </div>
                <div className="sale-price">
                  <span className="final-price">${auction.currentBid}</span>
                  <span className="commission">Starting: ${auction.startingBid}</span>
                  <span className={`net-earnings status-${auction.status}`}>
                    {auction.status.charAt(0).toUpperCase() + auction.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3>Performance Metrics</h3>
          </div>
          <div className="metrics-grid">
            <div className="metric">
              <span className="metric-label">Average Sale Price</span>
              <span className="metric-value">
                {loading ? '...' : `$${sellerStats.averagePrice || 0}`}
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">Success Rate</span>
              <span className="metric-value">
                {loading ? '...' : `${sellerStats.successRate || 0}%`}
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">Seller Rating</span>
              <span className="metric-value">
                {sellerStats.rating} ⭐
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">Followers</span>
              <span className="metric-value">{sellerStats.followers}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button 
            className="action-btn"
            onClick={() => onNavigate && onNavigate('list-new-item')}
          >
            <i className="fas fa-plus"></i>
            <span>List New Item</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => setActiveTab('inventory')}
          >
            <i className="fas fa-boxes"></i>
            <span>Manage Inventory</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => setActiveTab('earnings')}
          >
            <i className="fas fa-chart-line"></i>
            <span>View Earnings</span>
          </button>
          <button className="action-btn">
            <i className="fas fa-headset"></i>
            <span>Contact Support</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="inventory-section">
      <div className="section-header">
        <h3>My Inventory</h3>
        <div className="header-actions">
          <button 
            className="btn-outline small"
            onClick={fetchSellerAuctions}
            disabled={loading}
          >
            <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
            Refresh
          </button>
          <button 
            className="btn-primary"
            onClick={() => onNavigate && onNavigate('list-new-item')}
          >
            <i className="fas fa-plus"></i>
            List New Item
          </button>
        </div>
      </div>

      <div className="inventory-tabs">
        <button className="tab-btn active">Active ({activeListings.length})</button>
        <button className="tab-btn">Drafts ({draftListings.length})</button>
        <button className="tab-btn">Ended ({auctions.length - activeListings.length})</button>
        <button className="tab-btn">Sold ({sellerStats.soldItems})</button>
      </div>

      {loading && (
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading your auctions...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
          <button className="btn-outline small" onClick={fetchSellerAuctions}>
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && activeListings.length === 0 && (
        <div className="empty-state">
          <i className="fas fa-box-open"></i>
          <h4>No Active Auctions</h4>
          <p>You don't have any active auctions at the moment.</p>
          <button 
            className="btn-primary"
            onClick={() => onNavigate && onNavigate('list-new-item')}
          >
            <i className="fas fa-plus"></i>
            Create Your First Auction
          </button>
        </div>
      )}

      {!loading && !error && activeListings.length > 0 && (
        <div className="listings-grid">
          {activeListings.map(listing => (
          <div key={listing.id} className="listing-card">
            <div className="listing-image">
              <img src={auctions.find(a => a.id === listing.id)?.imageUrl || auctions.find(a => a.id === listing.id)?.image || `https://images.unsplash.com/photo-1500000000000?w=300&h=200&fit=crop`} alt={listing.title} />
              <div className="listing-status">
                <span className={`status-badge ${listing.status}`}>
                  {listing.status}
                </span>
              </div>
            </div>
            <div className="listing-content">
              <h4>{listing.title}</h4>
              <div className="listing-stats">
                <div className="bid-info">
                  <span>Current: ${listing.currentBid || 'No bids'}</span>
                  <span>Starting: ${listing.startingBid}</span>
                </div>
                <div className="activity-info">
                  <span><i className="fas fa-eye"></i> {listing.watchers}</span>
                  <span><i className="fas fa-gavel"></i> {listing.bidCount}</span>
                </div>
              </div>
              <div className="time-remaining">
                <i className="fas fa-clock"></i>
                {listing.timeLeft} remaining
              </div>
              <div className="listing-actions">
                <button className="btn-outline small">Edit</button>
                <button className="btn-outline small">Promote</button>
                <button className="btn-outline small">End Early</button>
              </div>
            </div>
          </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderOrders = () => (
    <div className="orders-section">
      <div className="section-header">
        <h3>Orders & Shipping</h3>
        <div className="filter-buttons">
          <button className="filter-btn active">All</button>
          <button className="filter-btn">Processing</button>
          <button className="filter-btn">Shipped</button>
          <button className="filter-btn">Delivered</button>
        </div>
      </div>

      <div className="orders-list">
        {orders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <div className="order-info">
                <h4>Order #{order.id}</h4>
                <span className={`order-status ${order.status}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              <div className="order-amount">${order.amount}</div>
            </div>
            <div className="order-details">
              <div className="order-item">
                <strong>{order.item}</strong>
                <p>Buyer: {order.buyer}</p>
                <p>Order Date: {order.orderDate}</p>
              </div>
              <div className="shipping-info">
                <h5>Shipping Address:</h5>
                <p>{order.shippingAddress}</p>
                {order.trackingNumber && (
                  <p><strong>Tracking:</strong> {order.trackingNumber}</p>
                )}
              </div>
            </div>
            <div className="order-actions">
              {order.status === 'processing' && (
                <>
                  <button className="btn-primary small">Mark as Shipped</button>
                  <button className="btn-outline small">Print Label</button>
                </>
              )}
              {order.status === 'shipped' && (
                <button className="btn-outline small">Update Tracking</button>
              )}
              <button className="btn-outline small">Contact Buyer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEarnings = () => (
    <div className="earnings-section">
      <div className="earnings-overview">
        <div className="earnings-card">
          <h3>Available Balance</h3>
          <div className="balance-amount">${earnings.availableBalance}</div>
          <button className="btn-primary">Request Payout</button>
        </div>
        <div className="earnings-card">
          <h3>Pending Payouts</h3>
          <div className="pending-amount">${earnings.pendingPayouts}</div>
          <p>Next payout: {earnings.nextPayout}</p>
        </div>
        <div className="earnings-card">
          <h3>This Month</h3>
          <div className="monthly-amount">${earnings.thisMonth}</div>
          <p className="growth">+27% from last month</p>
        </div>
      </div>

      <div className="earnings-chart">
        <h3>Earnings Overview</h3>
        <div className="chart-placeholder">
          <div className="chart-bars">
            <div className="chart-bar" style={{height: '60%'}}><span>Jan</span></div>
            <div className="chart-bar" style={{height: '75%'}}><span>Feb</span></div>
            <div className="chart-bar" style={{height: '45%'}}><span>Mar</span></div>
            <div className="chart-bar" style={{height: '80%'}}><span>Apr</span></div>
            <div className="chart-bar" style={{height: '95%'}}><span>May</span></div>
            <div className="chart-bar" style={{height: '70%'}}><span>Jun</span></div>
            <div className="chart-bar" style={{height: '85%'}}><span>Jul</span></div>
            <div className="chart-bar" style={{height: '100%'}}><span>Aug</span></div>
          </div>
        </div>
      </div>

      <div className="payout-history">
        <h3>Payout History</h3>
        <div className="payout-list">
          <div className="payout-item">
            <div className="payout-date">Aug 1, 2025</div>
            <div className="payout-amount">$425.50</div>
            <div className="payout-status completed">Completed</div>
          </div>
          <div className="payout-item">
            <div className="payout-date">Jul 15, 2025</div>
            <div className="payout-amount">$380.25</div>
            <div className="payout-status completed">Completed</div>
          </div>
          <div className="payout-item">
            <div className="payout-date">Jul 1, 2025</div>
            <div className="payout-amount">$520.75</div>
            <div className="payout-status completed">Completed</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="analytics-section">
      <div className="analytics-header">
        <h3>Performance Analytics</h3>
        <div className="date-range">
          <select>
            <option>Last 30 days</option>
            <option>Last 3 months</option>
            <option>Last 6 months</option>
            <option>This year</option>
          </select>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h4>Views & Engagement</h4>
          <div className="analytics-stats">
            <div className="stat">
              <span className="stat-number">2,450</span>
              <span className="stat-label">Total Views</span>
            </div>
            <div className="stat">
              <span className="stat-number">340</span>
              <span className="stat-label">Watchers</span>
            </div>
            <div className="stat">
              <span className="stat-number">13.9%</span>
              <span className="stat-label">Conversion Rate</span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h4>Top Performing Categories</h4>
          <div className="category-performance">
            <div className="category-item">
              <span>Textiles & Fabrics</span>
              <div className="performance-bar">
                <div className="bar-fill" style={{width: '85%'}}></div>
              </div>
              <span>85%</span>
            </div>
            <div className="category-item">
              <span>Pottery & Ceramics</span>
              <div className="performance-bar">
                <div className="bar-fill" style={{width: '72%'}}></div>
              </div>
              <span>72%</span>
            </div>
            <div className="category-item">
              <span>Woodwork</span>
              <div className="performance-bar">
                <div className="bar-fill" style={{width: '68%'}}></div>
              </div>
              <span>68%</span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h4>Buyer Demographics</h4>
          <div className="demographics">
            <div className="demo-item">
              <span>United States</span>
              <span>45%</span>
            </div>
            <div className="demo-item">
              <span>Canada</span>
              <span>18%</span>
            </div>
            <div className="demo-item">
              <span>United Kingdom</span>
              <span>12%</span>
            </div>
            <div className="demo-item">
              <span>Australia</span>
              <span>8%</span>
            </div>
            <div className="demo-item">
              <span>Others</span>
              <span>17%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="settings-section">
      <div className="settings-grid">
        <div className="settings-card">
          <h3>Account Information</h3>
          <form className="settings-form">
            <div className="form-group">
              <label>Display Name</label>
              <input type="text" defaultValue={user?.name || "John Doe"} />
            </div>
            <div className="form-group">
              <label>Shop Description</label>
              <textarea rows={3} defaultValue="Authentic handcrafted items from traditional artisans"></textarea>
            </div>
            <div className="form-group">
              <label>Location</label>
              <input type="text" defaultValue="Kashmir, India" />
            </div>
            <button className="btn-primary">Update Profile</button>
          </form>
        </div>

        <div className="settings-card">
          <h3>Payment Settings</h3>
          <form className="settings-form">
            <div className="form-group">
              <label>Bank Account</label>
              <input type="text" defaultValue="****1234" disabled />
            </div>
            <div className="form-group">
              <label>PayPal Email</label>
              <input type="email" defaultValue="seller@example.com" />
            </div>
            <div className="form-group">
              <label>Tax ID</label>
              <input type="text" defaultValue="****5678" />
            </div>
            <button className="btn-primary">Update Payment Info</button>
          </form>
        </div>

        <div className="settings-card">
          <h3>Notification Preferences</h3>
          <form className="settings-form">
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                <span className="checkmark"></span>
                Email me when items receive bids
              </label>
            </div>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                <span className="checkmark"></span>
                Send auction ending reminders
              </label>
            </div>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span className="checkmark"></span>
                Marketing and promotional emails
              </label>
            </div>
            <button className="btn-primary">Save Preferences</button>
          </form>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-chart-pie' },
    { id: 'inventory', label: 'Inventory', icon: 'fas fa-boxes' },
    { id: 'orders', label: 'Orders', icon: 'fas fa-shipping-fast' },
    { id: 'earnings', label: 'Earnings', icon: 'fas fa-dollar-sign' },
    { id: 'analytics', label: 'Analytics', icon: 'fas fa-chart-line' },
    { id: 'settings', label: 'Settings', icon: 'fas fa-cog' }
  ];

  return (
    <div className="seller-dashboard">
      {!user?.isAuthenticated && (
        <div className="demo-banner">
          <div className="container">
            <div className="demo-content">
              <div className="demo-info">
                <i className="fas fa-info-circle"></i>
                <span>You're viewing a demo seller dashboard. <strong>Sign up</strong> to access your own seller account.</span>
              </div>
              <div className="demo-actions">
                <button 
                  className="btn-outline small"
                  onClick={() => onNavigate && onNavigate('signup')}
                >
                  Create Account
                </button>
                <button 
                  className="btn-secondary small"
                  onClick={() => onNavigate && onNavigate('login')}
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <div className="seller-info">
              <div className="seller-avatar">
                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face" alt="Seller" />
              </div>
              <div className="seller-details">
                <h1>Welcome back, {user?.name || 'Demo Seller'}!</h1>
                <p>Artisan Seller • Member since 2023 • ⭐ {sellerStats.rating} rating</p>
              </div>
            </div>
            <div className="header-actions">
              <button 
                className="btn-primary"
                onClick={() => setShowListingModal(true)}
              >
                <i className="fas fa-plus"></i>
                List New Item
              </button>
              <button className="btn-outline">
                <i className="fas fa-store"></i>
                View Shop
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
          {activeTab === 'inventory' && renderInventory()}
          {activeTab === 'orders' && renderOrders()}
          {activeTab === 'earnings' && renderEarnings()}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>

      {showListingModal && (
        <QuickListingModal onClose={() => setShowListingModal(false)} />
      )}
    </div>
  );
};

// Quick Listing Modal Component
interface QuickListingModalProps {
  onClose: () => void;
}

const QuickListingModal: React.FC<QuickListingModalProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    startingBid: '',
    duration: '7',
    description: '',
    condition: 'good'
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }
    
    setImages(files);
    setError('');
    
    // Create previews
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => {
      // Clean up old previews
      prev.forEach(preview => URL.revokeObjectURL(preview));
      return previews;
    });
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // Clean up the removed preview
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.title.trim() || !formData.category || !formData.startingBid) {
        throw new Error('Please fill in all required fields');
      }

      if (images.length === 0) {
        throw new Error('Please add at least one image');
      }

      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('title', formData.title.trim());
      submitData.append('description', formData.description.trim() || `Beautiful ${formData.title}`);
      submitData.append('category', formData.category);
      submitData.append('startingPrice', formData.startingBid);
      submitData.append('condition', formData.condition);
      submitData.append('duration', formData.duration);
      
      // Add images
      images.forEach((image, index) => {
        submitData.append('images', image);
      });

      // Calculate end time based on duration
      const startTime = new Date();
      const endTime = new Date();
      endTime.setDate(endTime.getDate() + parseInt(formData.duration));
      
      submitData.append('startTime', startTime.toISOString());
      submitData.append('endTime', endTime.toISOString());

      console.log('🚀 Creating auction using auctionService...');
      const result = await auctionService.createAuction(submitData);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create auction');
      }

      console.log('✅ Auction created successfully:', result);
      
      // Show success message and close modal
      alert('Auction created successfully! It will be reviewed and published shortly.');
      onClose();

    } catch (err) {
      console.error('Error creating auction:', err);
      setError(err instanceof Error ? err.message : 'Failed to create auction');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content quick-listing-modal">
        <button className="modal-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
        
        <div className="modal-header">
          <h2>Quick List Item</h2>
          <p>Create a basic listing - you can add more details later</p>
        </div>

        <form onSubmit={handleSubmit} className="quick-listing-form">
          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="title">Item Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter item title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of your item..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="images">Item Images * (Max 5 images)</label>
            <div className="image-upload-area">
              <input
                type="file"
                id="images"
                name="images"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="image-input"
              />
              <div className="upload-prompt">
                <i className="fas fa-cloud-upload-alt"></i>
                <p>Click to upload images or drag and drop</p>
                <span>PNG, JPG, GIF up to 5MB each</span>
              </div>
            </div>
            
            {imagePreviews.length > 0 && (
              <div className="image-previews">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="image-preview">
                    <img src={preview} alt={`Preview ${index + 1}`} />
                    <button 
                      type="button" 
                      className="remove-image"
                      onClick={() => removeImage(index)}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Category</option>
                <option value="textiles">Textiles & Fabrics</option>
                <option value="pottery">Pottery & Ceramics</option>
                <option value="jewelry">Jewelry & Accessories</option>
                <option value="woodwork">Woodwork & Carving</option>
                <option value="metalwork">Metalwork</option>
                <option value="paintings">Paintings & Art</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="condition">Condition *</label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
                required
              >
                <option value="new">New</option>
                <option value="like-new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startingBid">Starting Bid ($) *</label>
              <input
                type="number"
                id="startingBid"
                name="startingBid"
                value={formData.startingBid}
                onChange={handleInputChange}
                placeholder="25"
                min="1"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="duration">Auction Duration</label>
              <select
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
              >
                <option value="3">3 Days</option>
                <option value="5">5 Days</option>
                <option value="7">7 Days</option>
                <option value="10">10 Days</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Creating...
                </>
              ) : (
                'Create Auction'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellerDashboard;
