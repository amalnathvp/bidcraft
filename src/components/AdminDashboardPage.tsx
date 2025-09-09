import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface AdminStats {
  totalUsers: number;
  activeAuctions: number;
  totalRevenue: number;
  pendingReviews: number;
  reportedContent: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

interface User {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  role: string;
  createdAt: string;
  lastActive: string;
  status: 'active' | 'suspended' | 'banned';
}

interface ReportedContent {
  _id: string;
  type: 'review' | 'auction' | 'user';
  reportedBy: string;
  targetId: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  content?: any;
}

interface AdminDashboardPageProps {
  onNavigate?: (page: string, data?: any) => void;
}

const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<ReportedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, usersResponse, reportsResponse] = await Promise.all([
        apiService.get('/admin/stats'),
        apiService.get('/admin/users'),
        apiService.get('/admin/reports')
      ]);

      if (statsResponse.success) setStats(statsResponse.data);
      if (usersResponse.success) setUsers(usersResponse.data);
      if (reportsResponse.success) setReports(reportsResponse.data);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, status: string) => {
    try {
      const response = await apiService.put(`/admin/users/${userId}/status`, { status });
      
      if (response.success) {
        setUsers(users.map(user => 
          user._id === userId ? { ...user, status: status as any } : user
        ));
        alert('User status updated successfully');
      } else {
        alert('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    }
  };

  const resolveReport = async (reportId: string, action: 'resolved' | 'dismissed') => {
    try {
      const response = await apiService.put(`/admin/reports/${reportId}`, { status: action });
      
      if (response.success) {
        setReports(reports.map(report => 
          report._id === reportId ? { ...report, status: action } : report
        ));
        alert(`Report ${action} successfully`);
      } else {
        alert(`Failed to ${action} report`);
      }
    } catch (error) {
      console.error(`Error ${action} report:`, error);
      alert(`Failed to ${action} report`);
    }
  };

  const deleteUser = async (userId: string) => {
    const confirmation = prompt('Type "DELETE" to confirm user deletion:');
    if (confirmation !== 'DELETE') return;

    try {
      const response = await apiService.delete(`/admin/users/${userId}`);
      
      if (response.success) {
        setUsers(users.filter(user => user._id !== userId));
        setShowUserModal(false);
        alert('User deleted successfully');
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'active': '#10b981',
      'suspended': '#f59e0b',
      'banned': '#ef4444',
      'healthy': '#10b981',
      'warning': '#f59e0b',
      'critical': '#ef4444',
      'pending': '#f59e0b',
      'resolved': '#10b981',
      'dismissed': '#6b7280'
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      'active': 'fa-check-circle',
      'suspended': 'fa-pause-circle',
      'banned': 'fa-times-circle',
      'healthy': 'fa-heartbeat',
      'warning': 'fa-exclamation-triangle',
      'critical': 'fa-exclamation-circle',
      'pending': 'fa-clock',
      'resolved': 'fa-check',
      'dismissed': 'fa-times'
    };
    return icons[status as keyof typeof icons] || 'fa-circle';
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="page-header">
          <button className="back-button" onClick={() => onNavigate?.('home')}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <h1>
            <i className="fas fa-shield-alt"></i>
            Admin Dashboard
          </h1>
          <div className="system-status">
            <i 
              className={`fas ${getStatusIcon(stats?.systemHealth || 'healthy')}`}
              style={{ color: getStatusColor(stats?.systemHealth || 'healthy') }}
            ></i>
            System {stats?.systemHealth || 'Healthy'}
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}

        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon users">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalUsers}</div>
                <div className="stat-label">Total Users</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon auctions">
                <i className="fas fa-gavel"></i>
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.activeAuctions}</div>
                <div className="stat-label">Active Auctions</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon revenue">
                <i className="fas fa-dollar-sign"></i>
              </div>
              <div className="stat-info">
                <div className="stat-value">${stats.totalRevenue}</div>
                <div className="stat-label">Total Revenue</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon reports">
                <i className="fas fa-flag"></i>
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.reportedContent}</div>
                <div className="stat-label">Reported Content</div>
              </div>
            </div>
          </div>
        )}

        <div className="admin-tabs">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fas fa-chart-line"></i>
            Overview
          </button>
          <button
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <i className="fas fa-users"></i>
            Users ({users.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <i className="fas fa-flag"></i>
            Reports ({reports.filter(r => r.status === 'pending').length})
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="tab-content">
            <div className="overview-grid">
              <div className="overview-card">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                  <div className="activity-item">
                    <i className="fas fa-user-plus"></i>
                    <span>5 new users registered today</span>
                  </div>
                  <div className="activity-item">
                    <i className="fas fa-gavel"></i>
                    <span>12 auctions created this week</span>
                  </div>
                  <div className="activity-item">
                    <i className="fas fa-flag"></i>
                    <span>3 new reports to review</span>
                  </div>
                </div>
              </div>

              <div className="overview-card">
                <h3>System Health</h3>
                <div className="health-metrics">
                  <div className="metric">
                    <span className="metric-label">Database</span>
                    <div className="metric-status healthy">
                      <i className="fas fa-check-circle"></i>
                      Healthy
                    </div>
                  </div>
                  <div className="metric">
                    <span className="metric-label">File Storage</span>
                    <div className="metric-status healthy">
                      <i className="fas fa-check-circle"></i>
                      Healthy
                    </div>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Email Service</span>
                    <div className="metric-status healthy">
                      <i className="fas fa-check-circle"></i>
                      Healthy
                    </div>
                  </div>
                </div>
              </div>

              <div className="overview-card">
                <h3>Quick Actions</h3>
                <div className="quick-actions">
                  <button className="action-btn" onClick={() => setActiveTab('users')}>
                    <i className="fas fa-users"></i>
                    Manage Users
                  </button>
                  <button className="action-btn" onClick={() => setActiveTab('reports')}>
                    <i className="fas fa-flag"></i>
                    Review Reports
                  </button>
                  <button className="action-btn" onClick={() => onNavigate?.('analytics')}>
                    <i className="fas fa-chart-bar"></i>
                    View Analytics
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="tab-content">
            <div className="users-table">
              <div className="table-header">
                <h3>User Management</h3>
                <div className="search-filter">
                  <input type="text" placeholder="Search users..." />
                  <select>
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="banned">Banned</option>
                  </select>
                </div>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Last Active</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user._id}>
                        <td>
                          <div className="user-info">
                            <div className="user-avatar">
                              <i className="fas fa-user"></i>
                            </div>
                            <div>
                              <div className="user-name">{user.firstName} {user.lastName}</div>
                              <div className="username">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="email-info">
                            {user.email}
                            {user.isEmailVerified && (
                              <i className="fas fa-check-circle verified"></i>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`role-badge ${user.role}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span 
                            className="status-badge"
                            style={{ 
                              backgroundColor: getStatusColor(user.status),
                              color: 'white'
                            }}
                          >
                            <i className={`fas ${getStatusIcon(user.status)}`}></i>
                            {user.status}
                          </span>
                        </td>
                        <td>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          {new Date(user.lastActive).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-sm btn-primary"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserModal(true);
                              }}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn-sm btn-danger"
                              onClick={() => deleteUser(user._id)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="tab-content">
            <div className="reports-section">
              <h3>Reported Content</h3>
              <div className="reports-list">
                {reports.map(report => (
                  <div key={report._id} className="report-card">
                    <div className="report-header">
                      <div className="report-type">
                        <i className={`fas ${report.type === 'review' ? 'fa-star' : report.type === 'auction' ? 'fa-gavel' : 'fa-user'}`}></i>
                        {report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report
                      </div>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(report.status) }}
                      >
                        {report.status}
                      </span>
                    </div>
                    
                    <div className="report-content">
                      <p><strong>Reason:</strong> {report.reason}</p>
                      <p><strong>Reported by:</strong> {report.reportedBy}</p>
                      <p><strong>Date:</strong> {new Date(report.createdAt).toLocaleDateString()}</p>
                    </div>

                    {report.status === 'pending' && (
                      <div className="report-actions">
                        <button
                          className="btn-success"
                          onClick={() => resolveReport(report._id, 'resolved')}
                        >
                          <i className="fas fa-check"></i>
                          Resolve
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => resolveReport(report._id, 'dismissed')}
                        >
                          <i className="fas fa-times"></i>
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showUserModal && selectedUser && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>User Management</h3>
                <button
                  className="close-btn"
                  onClick={() => setShowUserModal(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="modal-body">
                <div className="user-details">
                  <h4>{selectedUser.firstName} {selectedUser.lastName}</h4>
                  <p>@{selectedUser.username}</p>
                  <p>{selectedUser.email}</p>
                </div>

                <div className="status-actions">
                  <h5>Change User Status</h5>
                  <div className="status-buttons">
                    <button
                      className={`status-btn ${selectedUser.status === 'active' ? 'active' : ''}`}
                      onClick={() => updateUserStatus(selectedUser._id, 'active')}
                      style={{ backgroundColor: getStatusColor('active') }}
                    >
                      <i className="fas fa-check-circle"></i>
                      Active
                    </button>
                    <button
                      className={`status-btn ${selectedUser.status === 'suspended' ? 'active' : ''}`}
                      onClick={() => updateUserStatus(selectedUser._id, 'suspended')}
                      style={{ backgroundColor: getStatusColor('suspended') }}
                    >
                      <i className="fas fa-pause-circle"></i>
                      Suspend
                    </button>
                    <button
                      className={`status-btn ${selectedUser.status === 'banned' ? 'active' : ''}`}
                      onClick={() => updateUserStatus(selectedUser._id, 'banned')}
                      style={{ backgroundColor: getStatusColor('banned') }}
                    >
                      <i className="fas fa-ban"></i>
                      Ban
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .admin-dashboard {
          min-height: 100vh;
          background: #f8fafc;
          padding: 2rem 0;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
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
        }

        .system-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #6b7280;
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
          font-size: 1.5rem;
          color: white;
        }

        .stat-icon.users { background: #3b82f6; }
        .stat-icon.auctions { background: #10b981; }
        .stat-icon.revenue { background: #f59e0b; }
        .stat-icon.reports { background: #ef4444; }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
        }

        .stat-label {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .admin-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          background: white;
          padding: 0.5rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .tab-btn {
          flex: 1;
          padding: 0.75rem 1rem;
          border: none;
          background: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .tab-btn.active {
          background: #3b82f6;
          color: white;
        }

        .tab-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          padding: 2rem;
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .overview-card {
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .overview-card h3 {
          margin: 0 0 1rem 0;
          color: #1f2937;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #6b7280;
        }

        .activity-item i {
          color: #3b82f6;
          width: 16px;
        }

        .health-metrics {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .metric-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .metric-status.healthy {
          color: #10b981;
        }

        .quick-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .action-btn {
          padding: 0.75rem;
          border: 1px solid #e5e7eb;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: #f9fafb;
          border-color: #3b82f6;
        }

        .users-table {
          width: 100%;
        }

        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .table-header h3 {
          margin: 0;
          color: #1f2937;
        }

        .search-filter {
          display: flex;
          gap: 1rem;
        }

        .search-filter input,
        .search-filter select {
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
        }

        .table-container {
          overflow-x: auto;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        th {
          background: #f9fafb;
          font-weight: 600;
          color: #1f2937;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
        }

        .user-name {
          font-weight: 500;
          color: #1f2937;
        }

        .username {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .email-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .verified {
          color: #10b981;
        }

        .role-badge, .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: capitalize;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        .role-badge.admin { background: #fef3c7; color: #92400e; }
        .role-badge.user { background: #e0e7ff; color: #1e40af; }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .btn-sm {
          padding: 0.375rem 0.75rem;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .btn-primary { background: #3b82f6; color: white; }
        .btn-danger { background: #ef4444; color: white; }
        .btn-success { background: #10b981; color: white; }
        .btn-secondary { background: #6b7280; color: white; }

        .reports-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .report-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1.5rem;
          background: #fafafa;
        }

        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .report-type {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          color: #1f2937;
        }

        .report-content p {
          margin: 0.5rem 0;
          color: #6b7280;
        }

        .report-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 {
          margin: 0;
          color: #1f2937;
        }

        .close-btn {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          font-size: 1.25rem;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .user-details {
          margin-bottom: 2rem;
          text-align: center;
        }

        .user-details h4 {
          margin: 0 0 0.5rem 0;
          color: #1f2937;
        }

        .user-details p {
          margin: 0.25rem 0;
          color: #6b7280;
        }

        .status-buttons {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .status-btn {
          flex: 1;
          padding: 0.75rem;
          border: none;
          border-radius: 6px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: opacity 0.2s;
        }

        .status-btn:not(.active) {
          opacity: 0.7;
        }

        .loading-container {
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

        .error-banner {
          background: #fef2f2;
          color: #dc2626;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .admin-tabs {
            flex-direction: column;
          }

          .overview-grid {
            grid-template-columns: 1fr;
          }

          .table-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .search-filter {
            justify-content: stretch;
          }

          .search-filter input,
          .search-filter select {
            flex: 1;
          }

          .status-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboardPage;
