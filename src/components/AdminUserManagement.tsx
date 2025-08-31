import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AdminUserManagementProps {
  onNavigate: (page: string, data?: any) => void;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  joinDate: string;
  lastActive: string;
  totalAuctions?: number;
  totalBids?: number;
  verified: boolean;
}

const AdminUserManagement: React.FC<AdminUserManagementProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Load users data
  useEffect(() => {
    const loadUsers = async () => {
      try {
        // Mock data for now - replace with real API call
        setTimeout(() => {
          const mockUsers: User[] = [
            {
              _id: '1',
              name: 'John Smith',
              email: 'john@example.com',
              role: 'seller',
              status: 'active',
              joinDate: '2024-01-15',
              lastActive: '2024-02-28',
              totalAuctions: 25,
              verified: true
            },
            {
              _id: '2',
              name: 'Sarah Johnson',
              email: 'sarah@example.com',
              role: 'buyer',
              status: 'active',
              joinDate: '2024-02-01',
              lastActive: '2024-02-29',
              totalBids: 45,
              verified: true
            },
            {
              _id: '3',
              name: 'Mike Brown',
              email: 'mike@example.com',
              role: 'seller',
              status: 'suspended',
              joinDate: '2023-12-10',
              lastActive: '2024-02-25',
              totalAuctions: 8,
              verified: false
            },
            {
              _id: '4',
              name: 'Lisa Davis',
              email: 'lisa@example.com',
              role: 'buyer',
              status: 'pending',
              joinDate: '2024-02-28',
              lastActive: '2024-02-28',
              totalBids: 2,
              verified: false
            }
          ];
          
          setUsers(mockUsers);
          setFilteredUsers(mockUsers);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error loading users:', error);
        setLoading(false);
      }
    };

    if (user && user.role === 'admin') {
      loadUsers();
    }
  }, [user]);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.status === filterStatus);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterRole, filterStatus]);

  const handleUserAction = async (userId: string, action: string) => {
    try {
      console.log(`Performing ${action} on user ${userId}`);
      // Replace with actual API calls
      
      switch (action) {
        case 'suspend':
          setUsers(users.map(user => 
            user._id === userId ? { ...user, status: 'suspended' as const } : user
          ));
          break;
        case 'activate':
          setUsers(users.map(user => 
            user._id === userId ? { ...user, status: 'active' as const } : user
          ));
          break;
        case 'verify':
          setUsers(users.map(user => 
            user._id === userId ? { ...user, verified: true } : user
          ));
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            setUsers(users.filter(user => user._id !== userId));
          }
          break;
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      alert(`Failed to ${action} user. Please try again.`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'suspended': return '#EF4444';
      case 'pending': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'seller': return '🏪';
      case 'buyer': return '🛒';
      case 'admin': return '👑';
      default: return '👤';
    }
  };

  if (!user || user.role !== 'admin') {
    return <div>Access denied. Admin privileges required.</div>;
  }

  if (loading) {
    return (
      <div className="admin-users loading">
        <div className="container">
          <h1>Loading Users...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users">
      <div className="container">
        {/* Header */}
        <div className="admin-header">
          <button 
            className="back-button"
            onClick={() => onNavigate('admin-dashboard')}
          >
            ← Back to Dashboard
          </button>
          <h1>User Management</h1>
          <p>Manage all users, sellers, and buyers on the platform</p>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-controls">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="buyer">Buyers</option>
              <option value="seller">Sellers</option>
              <option value="admin">Admins</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="user-stats">
          <div className="stat-item">
            <span className="count">{users.length}</span>
            <span className="label">Total Users</span>
          </div>
          <div className="stat-item">
            <span className="count">{users.filter(u => u.role === 'seller').length}</span>
            <span className="label">Sellers</span>
          </div>
          <div className="stat-item">
            <span className="count">{users.filter(u => u.role === 'buyer').length}</span>
            <span className="label">Buyers</span>
          </div>
          <div className="stat-item">
            <span className="count">{users.filter(u => u.status === 'active').length}</span>
            <span className="label">Active</span>
          </div>
        </div>

        {/* Users Table */}
        <div className="users-table">
          <div className="table-header">
            <div>User</div>
            <div>Role</div>
            <div>Status</div>
            <div>Activity</div>
            <div>Actions</div>
          </div>

          {filteredUsers.map(user => (
            <div key={user._id} className="table-row">
              <div className="user-info">
                <div className="user-avatar">
                  {getRoleIcon(user.role)}
                </div>
                <div className="user-details">
                  <div className="user-name">
                    {user.name}
                    {user.verified && <span className="verified-badge">✓</span>}
                  </div>
                  <div className="user-email">{user.email}</div>
                </div>
              </div>

              <div className="user-role">
                <span className={`role-badge ${user.role}`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>

              <div className="user-status">
                <span 
                  className="status-indicator"
                  style={{ backgroundColor: getStatusColor(user.status) }}
                >
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </span>
              </div>

              <div className="user-activity">
                <div>Joined: {new Date(user.joinDate).toLocaleDateString()}</div>
                <div>Last active: {new Date(user.lastActive).toLocaleDateString()}</div>
                {user.totalAuctions && <div>Auctions: {user.totalAuctions}</div>}
                {user.totalBids && <div>Bids: {user.totalBids}</div>}
              </div>

              <div className="user-actions">
                <button
                  className="action-btn view"
                  onClick={() => {
                    setSelectedUser(user);
                    setShowModal(true);
                  }}
                >
                  View
                </button>

                {user.status === 'active' ? (
                  <button
                    className="action-btn suspend"
                    onClick={() => handleUserAction(user._id, 'suspend')}
                  >
                    Suspend
                  </button>
                ) : (
                  <button
                    className="action-btn activate"
                    onClick={() => handleUserAction(user._id, 'activate')}
                  >
                    Activate
                  </button>
                )}

                {!user.verified && (
                  <button
                    className="action-btn verify"
                    onClick={() => handleUserAction(user._id, 'verify')}
                  >
                    Verify
                  </button>
                )}

                <button
                  className="action-btn delete"
                  onClick={() => handleUserAction(user._id, 'delete')}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="no-results">
            <h3>No users found</h3>
            <p>Try adjusting your search or filter criteria.</p>
          </div>
        )}

        {/* User Detail Modal */}
        {showModal && selectedUser && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>User Details</h2>
                <button
                  className="close-button"
                  onClick={() => setShowModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="user-detail-content">
                <div className="detail-section">
                  <h3>Basic Information</h3>
                  <p><strong>Name:</strong> {selectedUser.name}</p>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Role:</strong> {selectedUser.role}</p>
                  <p><strong>Status:</strong> {selectedUser.status}</p>
                  <p><strong>Verified:</strong> {selectedUser.verified ? 'Yes' : 'No'}</p>
                </div>

                <div className="detail-section">
                  <h3>Activity</h3>
                  <p><strong>Join Date:</strong> {new Date(selectedUser.joinDate).toLocaleDateString()}</p>
                  <p><strong>Last Active:</strong> {new Date(selectedUser.lastActive).toLocaleDateString()}</p>
                  {selectedUser.totalAuctions && (
                    <p><strong>Total Auctions:</strong> {selectedUser.totalAuctions}</p>
                  )}
                  {selectedUser.totalBids && (
                    <p><strong>Total Bids:</strong> {selectedUser.totalBids}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserManagement;
