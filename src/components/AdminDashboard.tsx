import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AdminDashboardProps {
  onNavigate: (page: string, data?: any) => void;
}

interface DashboardStats {
  totalUsers: number;
  totalSellers: number;
  totalBuyers: number;
  totalAuctions: number;
  activeAuctions: number;
  totalBids: number;
  totalRevenue: number;
  pendingReports: number;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalSellers: 0,
    totalBuyers: 0,
    totalAuctions: 0,
    activeAuctions: 0,
    totalBids: 0,
    totalRevenue: 0,
    pendingReports: 0
  });
  const [loading, setLoading] = useState(true);

  // Load dashboard statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        // Mock data for now - replace with real API calls
        setTimeout(() => {
          setStats({
            totalUsers: 1234,
            totalSellers: 456,
            totalBuyers: 778,
            totalAuctions: 892,
            activeAuctions: 145,
            totalBids: 5678,
            totalRevenue: 125000,
            pendingReports: 12
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error loading admin stats:', error);
        setLoading(false);
      }
    };

    if (user && user.role === 'admin') {
      loadStats();
    }
  }, [user]);

  if (!user || user.role !== 'admin') {
    return <div>Access denied. Admin privileges required.</div>;
  }

  if (loading) {
    return (
      <div className="admin-dashboard loading">
        <div className="container">
          <h1>Loading Admin Dashboard...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <p>Welcome back, {user.firstName} {user.lastName}! Manage your BidCraft platform.</p>
        </div>

        {/* Quick Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{stats.totalUsers}</h3>
              <p>Total Users</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🏪</div>
            <div className="stat-content">
              <h3>{stats.totalSellers}</h3>
              <p>Sellers</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🛒</div>
            <div className="stat-content">
              <h3>{stats.totalBuyers}</h3>
              <p>Buyers</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🏷️</div>
            <div className="stat-content">
              <h3>{stats.totalAuctions}</h3>
              <p>Total Auctions</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <h3>{stats.activeAuctions}</h3>
              <p>Active Auctions</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>${stats.totalRevenue.toLocaleString()}</h3>
              <p>Total Revenue</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h3>{stats.totalBids}</h3>
              <p>Total Bids</p>
            </div>
          </div>

          <div className="stat-card urgent">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <h3>{stats.pendingReports}</h3>
              <p>Pending Reports</p>
            </div>
          </div>
        </div>

        {/* Management Actions */}
        <div className="admin-actions">
          <h2>Management Tools</h2>
          
          <div className="actions-grid">
            <div className="action-card" onClick={() => onNavigate('admin-users')}>
              <div className="action-icon">👥</div>
              <div className="action-content">
                <h3>User Management</h3>
                <p>Manage all users, sellers, and buyers</p>
              </div>
              <div className="action-arrow">→</div>
            </div>

            <div className="action-card" onClick={() => onNavigate('admin-auctions')}>
              <div className="action-icon">🏷️</div>
              <div className="action-content">
                <h3>Auction Management</h3>
                <p>View, edit, and moderate auctions</p>
              </div>
              <div className="action-arrow">→</div>
            </div>

            <div className="action-card" onClick={() => onNavigate('admin-categories')}>
              <div className="action-icon">📂</div>
              <div className="action-content">
                <h3>Category Management</h3>
                <p>Add, edit, and organize categories</p>
              </div>
              <div className="action-arrow">→</div>
            </div>

            <div className="action-card" onClick={() => onNavigate('admin-reports')}>
              <div className="action-icon">🚨</div>
              <div className="action-content">
                <h3>Reports & Moderation</h3>
                <p>Handle user reports and violations</p>
              </div>
              <div className="action-arrow">→</div>
            </div>

            <div className="action-card" onClick={() => onNavigate('admin-analytics')}>
              <div className="action-icon">📊</div>
              <div className="action-content">
                <h3>Analytics</h3>
                <p>View detailed platform analytics</p>
              </div>
              <div className="action-arrow">→</div>
            </div>

            <div className="action-card" onClick={() => onNavigate('admin-settings')}>
              <div className="action-icon">⚙️</div>
              <div className="action-content">
                <h3>System Settings</h3>
                <p>Configure platform settings and features</p>
              </div>
              <div className="action-arrow">→</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-time">2 hours ago</div>
              <div className="activity-content">
                <strong>New seller registration:</strong> John's Crafts
              </div>
            </div>
            
            <div className="activity-item">
              <div className="activity-time">4 hours ago</div>
              <div className="activity-content">
                <strong>Auction reported:</strong> "Vintage Pottery Set" - Inappropriate content
              </div>
            </div>
            
            <div className="activity-item">
              <div className="activity-time">6 hours ago</div>
              <div className="activity-content">
                <strong>High-value auction completed:</strong> $2,500 winning bid on handwoven rug
              </div>
            </div>
            
            <div className="activity-item">
              <div className="activity-time">1 day ago</div>
              <div className="activity-content">
                <strong>New category created:</strong> Traditional Instruments
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
