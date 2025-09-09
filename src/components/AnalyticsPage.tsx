import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface AnalyticsData {
  totalUsers: number;
  totalAuctions: number;
  totalBids: number;
  totalRevenue: number;
  revenueGrowth: number;
  activeUsers: number;
  userGrowth: number;
  auctionGrowth: number;
  popularCategories: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    auctions: number;
  }>;
  topSellers: Array<{
    seller: {
      name: string;
      shopName?: string;
    };
    totalSales: number;
    totalRevenue: number;
    rating: number;
  }>;
  topBuyers: Array<{
    buyer: {
      name: string;
    };
    totalPurchases: number;
    totalSpent: number;
  }>;
  auctionsByStatus: {
    active: number;
    completed: number;
    cancelled: number;
  };
  bidsByHour: Array<{
    hour: number;
    bids: number;
  }>;
}

interface AnalyticsPageProps {
  onNavigate?: (page: string, data?: any) => void;
  userRole?: 'admin' | 'seller';
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onNavigate, userRole = 'admin' }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const endpoint = userRole === 'seller' ? '/analytics/seller' : '/analytics/overview';
      const response = await apiService.get(`${endpoint}?timeRange=${timeRange}`);
      
      if (response.success) {
        setAnalytics(response.data);
      } else {
        setError('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? '#10b981' : '#ef4444';
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="analytics-page">
        <div className="error-container">
          <i className="fas fa-exclamation-triangle"></i>
          <h3>Failed to load analytics</h3>
          <p>{error}</p>
          <button className="btn-primary" onClick={fetchAnalytics}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="container">
        <div className="page-header">
          <button className="back-button" onClick={() => onNavigate?.('home')}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <h1>
            <i className="fas fa-chart-line"></i>
            Analytics Dashboard
          </h1>
          <div className="header-controls">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="time-range-select"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>

        <div className="analytics-tabs">
          {['overview', 'revenue', 'users', 'auctions'].map(tab => (
            <button
              key={tab}
              className={`tab-btn ${selectedTab === tab ? 'active' : ''}`}
              onClick={() => setSelectedTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {selectedTab === 'overview' && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon revenue">
                  <i className="fas fa-dollar-sign"></i>
                </div>
                <div className="stat-content">
                  <h3>{formatCurrency(analytics.totalRevenue)}</h3>
                  <p>Total Revenue</p>
                  <div className="growth-indicator">
                    <i className={getGrowthIcon(analytics.revenueGrowth)}></i>
                    <span style={{ color: getGrowthColor(analytics.revenueGrowth) }}>
                      {Math.abs(analytics.revenueGrowth).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon users">
                  <i className="fas fa-users"></i>
                </div>
                <div className="stat-content">
                  <h3>{formatNumber(analytics.totalUsers)}</h3>
                  <p>Total Users</p>
                  <div className="growth-indicator">
                    <i className={getGrowthIcon(analytics.userGrowth)}></i>
                    <span style={{ color: getGrowthColor(analytics.userGrowth) }}>
                      {Math.abs(analytics.userGrowth).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon auctions">
                  <i className="fas fa-gavel"></i>
                </div>
                <div className="stat-content">
                  <h3>{formatNumber(analytics.totalAuctions)}</h3>
                  <p>Total Auctions</p>
                  <div className="growth-indicator">
                    <i className={getGrowthIcon(analytics.auctionGrowth)}></i>
                    <span style={{ color: getGrowthColor(analytics.auctionGrowth) }}>
                      {Math.abs(analytics.auctionGrowth).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon bids">
                  <i className="fas fa-hand-paper"></i>
                </div>
                <div className="stat-content">
                  <h3>{formatNumber(analytics.totalBids)}</h3>
                  <p>Total Bids</p>
                  <div className="growth-indicator">
                    <i className="fas fa-chart-line"></i>
                    <span style={{ color: '#3b82f6' }}>Active</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="charts-section">
              <div className="chart-card">
                <h3>Popular Categories</h3>
                <div className="category-chart">
                  {analytics.popularCategories.map((category, index) => (
                    <div key={index} className="category-bar">
                      <div className="category-info">
                        <span className="category-name">{category.category}</span>
                        <span className="category-count">{category.count}</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                      <span className="percentage">{category.percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-card">
                <h3>Auction Status Distribution</h3>
                <div className="status-chart">
                  <div className="status-item">
                    <div className="status-indicator active"></div>
                    <span>Active: {analytics.auctionsByStatus.active}</span>
                  </div>
                  <div className="status-item">
                    <div className="status-indicator completed"></div>
                    <span>Completed: {analytics.auctionsByStatus.completed}</span>
                  </div>
                  <div className="status-item">
                    <div className="status-indicator cancelled"></div>
                    <span>Cancelled: {analytics.auctionsByStatus.cancelled}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'revenue' && (
          <div className="revenue-section">
            <div className="revenue-chart-card">
              <h3>Revenue Trend</h3>
              <div className="revenue-chart">
                {analytics.revenueByMonth.map((month, index) => (
                  <div key={index} className="revenue-bar">
                    <div className="bar-container">
                      <div 
                        className="bar"
                        style={{ 
                          height: `${(month.revenue / Math.max(...analytics.revenueByMonth.map(m => m.revenue))) * 100}%`
                        }}
                      ></div>
                    </div>
                    <div className="bar-label">
                      <div className="month">{month.month}</div>
                      <div className="amount">{formatCurrency(month.revenue)}</div>
                      <div className="auctions">{month.auctions} auctions</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'users' && (
          <div className="users-section">
            <div className="users-stats">
              <div className="user-stat-card">
                <h4>Active Users</h4>
                <div className="big-number">{formatNumber(analytics.activeUsers)}</div>
                <p>Currently online</p>
              </div>
              <div className="user-stat-card">
                <h4>User Growth</h4>
                <div className="big-number" style={{ color: getGrowthColor(analytics.userGrowth) }}>
                  {analytics.userGrowth >= 0 ? '+' : ''}{analytics.userGrowth.toFixed(1)}%
                </div>
                <p>This period</p>
              </div>
            </div>

            <div className="top-users">
              <div className="top-list">
                <h3>Top Sellers</h3>
                {analytics.topSellers.map((seller, index) => (
                  <div key={index} className="user-item">
                    <div className="user-rank">#{index + 1}</div>
                    <div className="user-info">
                      <h4>{seller.seller.shopName || seller.seller.name}</h4>
                      <p>{seller.totalSales} sales • {formatCurrency(seller.totalRevenue)}</p>
                    </div>
                    <div className="user-rating">
                      <i className="fas fa-star"></i>
                      {seller.rating.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="top-list">
                <h3>Top Buyers</h3>
                {analytics.topBuyers.map((buyer, index) => (
                  <div key={index} className="user-item">
                    <div className="user-rank">#{index + 1}</div>
                    <div className="user-info">
                      <h4>{buyer.buyer.name}</h4>
                      <p>{buyer.totalPurchases} purchases • {formatCurrency(buyer.totalSpent)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'auctions' && (
          <div className="auctions-section">
            <div className="activity-chart-card">
              <h3>Bidding Activity by Hour</h3>
              <div className="activity-chart">
                {analytics.bidsByHour.map((hour, index) => (
                  <div key={index} className="activity-bar">
                    <div 
                      className="activity-fill"
                      style={{ 
                        height: `${(hour.bids / Math.max(...analytics.bidsByHour.map(h => h.bids))) * 100}%`
                      }}
                    ></div>
                    <div className="hour-label">{hour.hour}:00</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .analytics-page {
          min-height: 100vh;
          background: #f8fafc;
          padding: 2rem 0;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          position: relative;
        }

        .back-button {
          background: none;
          border: none;
          color: #6b7280;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .page-header h1 {
          margin: 0;
          color: #1f2937;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }

        .time-range-select {
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          cursor: pointer;
        }

        .analytics-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          background: white;
          padding: 0.5rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .tab-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          background: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .tab-btn.active {
          background: #3b82f6;
          color: white;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.5rem;
        }

        .stat-icon.revenue {
          background: linear-gradient(135deg, #10b981, #059669);
        }

        .stat-icon.users {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
        }

        .stat-icon.auctions {
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        }

        .stat-icon.bids {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }

        .stat-content h3 {
          margin: 0 0 0.25rem 0;
          font-size: 1.75rem;
          color: #1f2937;
        }

        .stat-content p {
          margin: 0 0 0.5rem 0;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .growth-indicator {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .charts-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .chart-card {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .chart-card h3 {
          margin: 0 0 1.5rem 0;
          color: #1f2937;
        }

        .category-chart {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .category-bar {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .category-info {
          flex: 1;
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
        }

        .category-name {
          color: #374151;
        }

        .category-count {
          color: #6b7280;
        }

        .progress-bar {
          flex: 2;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #1d4ed8);
          transition: width 0.3s ease;
        }

        .percentage {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .status-chart {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.875rem;
        }

        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .status-indicator.active {
          background: #10b981;
        }

        .status-indicator.completed {
          background: #3b82f6;
        }

        .status-indicator.cancelled {
          background: #ef4444;
        }

        .revenue-chart-card {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .revenue-chart {
          display: flex;
          gap: 1rem;
          align-items: end;
          height: 300px;
          padding: 1rem 0;
        }

        .revenue-bar {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
        }

        .bar-container {
          flex: 1;
          width: 40px;
          display: flex;
          align-items: end;
        }

        .bar {
          width: 100%;
          background: linear-gradient(to top, #3b82f6, #60a5fa);
          border-radius: 4px 4px 0 0;
          min-height: 10px;
        }

        .bar-label {
          text-align: center;
          margin-top: 0.5rem;
        }

        .month {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .amount {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1f2937;
        }

        .bar-label .auctions {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .users-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .user-stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .big-number {
          font-size: 2.5rem;
          font-weight: bold;
          color: #1f2937;
          margin: 0.5rem 0;
        }

        .top-users {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .top-list {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .top-list h3 {
          margin: 0 0 1.5rem 0;
          color: #1f2937;
        }

        .user-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .user-item:last-child {
          border-bottom: none;
        }

        .user-rank {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #3b82f6;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .user-info {
          flex: 1;
        }

        .user-info h4 {
          margin: 0 0 0.25rem 0;
          color: #1f2937;
        }

        .user-info p {
          margin: 0;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .user-rating {
          color: #f59e0b;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .activity-chart-card {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .activity-chart {
          display: flex;
          gap: 0.5rem;
          align-items: end;
          height: 200px;
          padding: 1rem 0;
        }

        .activity-bar {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
        }

        .activity-fill {
          width: 20px;
          background: linear-gradient(to top, #8b5cf6, #a78bfa);
          border-radius: 2px;
          min-height: 5px;
        }

        .hour-label {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.5rem;
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }

        .loading-container, .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
          gap: 1rem;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-container i {
          font-size: 3rem;
          color: #ef4444;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        @media (max-width: 1024px) {
          .charts-section {
            grid-template-columns: 1fr;
          }

          .top-users {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            gap: 1rem;
          }

          .page-header h1 {
            position: static;
            transform: none;
          }

          .analytics-tabs {
            flex-wrap: wrap;
          }

          .activity-chart {
            gap: 0.25rem;
          }

          .hour-label {
            writing-mode: initial;
            text-orientation: initial;
          }
        }
      `}</style>
    </div>
  );
};

export default AnalyticsPage;
