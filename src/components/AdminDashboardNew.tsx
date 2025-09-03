import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AdminDashboardProps {
  onNavigate: (page: string, data?: any) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  
  return (
    <div className="admin-dashboard" style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: '#333', marginBottom: '20px' }}>🎛️ Admin Dashboard</h1>
        
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Welcome to the BidCraft Admin Dashboard! User: {user?.email || 'Not logged in'}
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={{ background: '#e3f2fd', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <h3 style={{ color: '#1976d2', margin: '0 0 10px 0' }}>Total Users</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', margin: '0' }}>1,234</p>
            </div>
            
            <div style={{ background: '#e8f5e8', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <h3 style={{ color: '#388e3c', margin: '0 0 10px 0' }}>Active Auctions</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', margin: '0' }}>145</p>
            </div>
            
            <div style={{ background: '#fff3e0', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <h3 style={{ color: '#f57c00', margin: '0 0 10px 0' }}>Total Revenue</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', margin: '0' }}>$125,000</p>
            </div>
            
            <div style={{ background: '#fce4ec', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <h3 style={{ color: '#c2185b', margin: '0 0 10px 0' }}>Pending Reports</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', margin: '0' }}>12</p>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <button 
              onClick={() => onNavigate('admin-users')} 
              style={{ 
                padding: '15px 20px', 
                background: '#007bff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              👥 Manage Users
            </button>
            
            <button 
              onClick={() => onNavigate('admin-auctions')} 
              style={{ 
                padding: '15px 20px', 
                background: '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              🔨 Manage Auctions
            </button>
            
            <button 
              onClick={() => onNavigate('admin-categories')} 
              style={{ 
                padding: '15px 20px', 
                background: '#17a2b8', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              📂 Manage Categories
            </button>
            
            <button 
              onClick={() => onNavigate('admin-reports')} 
              style={{ 
                padding: '15px 20px', 
                background: '#ffc107', 
                color: '#333', 
                border: 'none', 
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              📊 View Reports
            </button>
            
            <button 
              onClick={() => onNavigate('home')} 
              style={{ 
                padding: '15px 20px', 
                background: '#6c757d', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              🏠 Back to Home
            </button>
            
            <button 
              onClick={() => {
                console.log('Current page state:', window.location.pathname);
                console.log('Admin dashboard loaded successfully!');
                alert('Admin Dashboard is working! Check console for details.');
              }} 
              style={{ 
                padding: '15px 20px', 
                background: '#dc3545', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              🔍 Debug Info
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
