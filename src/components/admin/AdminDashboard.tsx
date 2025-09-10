import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { adminService, DashboardStats } from '../../services/adminService';

interface AdminDashboardProps {
  onNavigate: (page: string, data?: any) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 5,
    totalAuctions: 0,
    totalRevenue: 0,
    totalCommission: 0,
    activeUsers: 3,
    pendingApprovals: 0,
    disputesOpen: 0,
    fraudAlerts: 0,
    recentActivity: {
      newUsersToday: 0,
      newAuctionsToday: 0,
      ordersToday: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard stats from backend
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const dashboardData = await adminService.getDashboardStats();
        setStats(dashboardData);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const adminFeatures = [
    {
      id: 'analytics',
      title: 'Dashboard Analytics',
      description: 'View comprehensive analytics, user trends, and revenue insights',
      icon: '📊',
      color: '#4CAF50',
      urgent: false
    },
    {
      id: 'commission',
      title: 'Commission Management',
      description: 'Manage platform fees, commission rates, and payment processing',
      icon: '💰',
      color: '#2196F3',
      urgent: false
    },
    {
      id: 'fraud',
      title: 'Fraud Detection',
      description: 'Monitor suspicious activities and manage security alerts',
      icon: '🛡️',
      color: '#FF9800',
      urgent: stats.fraudAlerts > 0
    },
    {
      id: 'moderation',
      title: 'Content Moderation',
      description: 'Review and approve auction listings, user content',
      icon: '✅',
      color: '#9C27B0',
      urgent: stats.pendingApprovals > 0
    },
    {
      id: 'disputes',
      title: 'Dispute Resolution',
      description: 'Handle customer disputes and transaction issues',
      icon: '⚖️',
      color: '#F44336',
      urgent: stats.disputesOpen > 0
    },
    {
      id: 'featured',
      title: 'Featured Auctions',
      description: 'Manage paid promotions and featured listings',
      icon: '🌟',
      color: '#FF5722',
      urgent: false
    }
  ];

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      minHeight: '100vh',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        padding: '20px 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ 
                color: 'white', 
                margin: '0 0 5px 0', 
                fontSize: '32px', 
                fontWeight: 'bold' 
              }}>
                🎛️ BidCraft Admin Panel
              </h1>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '0', fontSize: '16px' }}>
                Welcome back, {user?.email || 'Administrator'} | Last login: Today at 9:42 AM
              </p>
            </div>
            <button
              onClick={() => onNavigate('home')}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '25px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              🏠 Back to Site
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Loading State */}
        {loading && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '40px',
            textAlign: 'center',
            marginBottom: '40px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Loading Dashboard...</h3>
            <p style={{ margin: '0', color: '#666' }}>Fetching the latest statistics from the database</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '40px',
            textAlign: 'center',
            marginBottom: '40px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '2px solid #FF5722'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#FF5722' }}>Error Loading Dashboard</h3>
            <p style={{ margin: '0 0 20px 0', color: '#666' }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#FF5722',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '25px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Key Statistics Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px', 
          marginBottom: '40px' 
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px', fontWeight: '500' }}>Total Users</p>
                <p style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#2196F3' }}>
                  {stats.totalUsers.toLocaleString()}
                </p>
                <p style={{ margin: '5px 0 0 0', color: '#4CAF50', fontSize: '12px' }}>+12% this month</p>
              </div>
              <div style={{ fontSize: '40px' }}>👥</div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px', fontWeight: '500' }}>Total Revenue</p>
                <p style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#4CAF50' }}>
                  ${stats.totalRevenue.toLocaleString()}
                </p>
                <p style={{ margin: '5px 0 0 0', color: '#4CAF50', fontSize: '12px' }}>+8% this month</p>
              </div>
              <div style={{ fontSize: '40px' }}>💰</div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px', fontWeight: '500' }}>Commission Earned</p>
                <p style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#FF9800' }}>
                  ${stats.totalCommission.toLocaleString()}
                </p>
                <p style={{ margin: '5px 0 0 0', color: '#4CAF50', fontSize: '12px' }}>5% avg rate</p>
              </div>
              <div style={{ fontSize: '40px' }}>📈</div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px', fontWeight: '500' }}>Active Now</p>
                <p style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#9C27B0' }}>
                  {stats.activeUsers}
                </p>
                <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '12px' }}>users online</p>
              </div>
              <div style={{ fontSize: '40px' }}>🌐</div>
            </div>
          </div>
        </div>

        {/* Admin Features Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: '25px',
          marginBottom: '40px'
        }}>
          {adminFeatures.map((feature) => (
            <div
              key={feature.id}
              onClick={() => onNavigate(`admin-${feature.id}`)}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '20px',
                padding: '30px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: feature.urgent ? '2px solid #FF5722' : '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
              }}
            >
              {feature.urgent && (
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  background: '#FF5722',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  URGENT
                </div>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <div style={{ 
                  fontSize: '48px', 
                  marginRight: '20px',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                }}>
                  {feature.icon}
                </div>
                <div>
                  <h3 style={{ 
                    margin: '0 0 5px 0', 
                    color: feature.color, 
                    fontSize: '20px', 
                    fontWeight: 'bold' 
                  }}>
                    {feature.title}
                  </h3>
                  {feature.urgent && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ color: '#FF5722', fontSize: '12px', fontWeight: 'bold' }}>
                        {feature.id === 'fraud' && `${stats.fraudAlerts} alerts`}
                        {feature.id === 'moderation' && `${stats.pendingApprovals} pending`}
                        {feature.id === 'disputes' && `${stats.disputesOpen} open`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <p style={{ 
                margin: '0', 
                color: '#666', 
                fontSize: '14px', 
                lineHeight: '1.5' 
              }}>
                {feature.description}
              </p>
              
              <div style={{
                marginTop: '20px',
                display: 'flex',
                alignItems: 'center',
                color: feature.color,
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Manage →
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '20px', fontWeight: 'bold' }}>
            🚀 Quick Actions
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            {[
              { label: 'Export User Data', icon: '📊' },
              { label: 'Send Platform Notice', icon: '📢' },
              { label: 'Generate Reports', icon: '📈' },
              { label: 'Backup Database', icon: '💾' },
              { label: 'System Health Check', icon: '🔧' }
            ].map((action, index) => (
              <button
                key={index}
                style={{
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span>{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
