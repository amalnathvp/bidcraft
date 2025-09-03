import React from 'react';

interface TestAdminDashboardProps {
  onNavigate: (page: string, data?: any) => void;
}

const TestAdminDashboard: React.FC<TestAdminDashboardProps> = ({ onNavigate }) => {
  console.log('🎯 TestAdminDashboard component is rendering!');
  
  return (
    <div style={{ padding: '20px', background: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>🔧 Test Admin Dashboard</h1>
      
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <p style={{ marginBottom: '20px' }}>Admin Dashboard is working! Click buttons to test navigation:</p>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => {
              console.log('🔥 Test: Manage Users clicked');
              alert('Navigate to Manage Users clicked!');
              onNavigate('admin-users');
            }}
            style={{ 
              padding: '10px 20px', 
              background: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            👥 Manage Users (Test)
          </button>
          
          <button 
            onClick={() => {
              console.log('🔥 Test: Manage Auctions clicked');
              alert('Navigate to Manage Auctions clicked!');
              onNavigate('admin-auctions');
            }}
            style={{ 
              padding: '10px 20px', 
              background: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🔨 Manage Auctions (Test)
          </button>
          
          <button 
            onClick={() => {
              console.log('🔥 Test: Back to Home clicked');
              alert('Navigate to Home clicked!');
              onNavigate('home');
            }}
            style={{ 
              padding: '10px 20px', 
              background: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🏠 Back to Home (Test)
          </button>
          
          <button 
            onClick={() => {
              console.log('🔥 Current location:', window.location.href);
              alert(`Debug: Current URL is ${window.location.href}`);
            }}
            style={{ 
              padding: '10px 20px', 
              background: '#dc3545', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🔍 Debug Info (Test)
          </button>
        </div>
      </div>
      
      <div style={{ background: '#e9ecef', padding: '15px', borderRadius: '5px' }}>
        <p><strong>Debug Info:</strong></p>
        <p>• Current URL: {window.location.href}</p>
        <p>• Component loaded successfully ✅</p>
        <p>• onNavigate function: {typeof onNavigate}</p>
      </div>
    </div>
  );
};

export default TestAdminDashboard;
