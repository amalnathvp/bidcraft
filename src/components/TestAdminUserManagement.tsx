import React from 'react';

interface TestAdminUserManagementProps {
  onNavigate: (page: string, data?: any) => void;
}

const TestAdminUserManagement: React.FC<TestAdminUserManagementProps> = ({ onNavigate }) => {
  console.log('👥 TestAdminUserManagement component is rendering!');
  
  return (
    <div style={{ padding: '20px', background: '#f0f8ff', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>👥 Test User Management</h1>
      
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <p style={{ marginBottom: '20px' }}>✅ User Management page loaded successfully!</p>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            onClick={() => {
              console.log('🔙 Back to Admin Dashboard clicked');
              onNavigate('admin-dashboard');
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
            ← Back to Dashboard
          </button>
          
          <button 
            onClick={() => {
              console.log('🏠 Back to Home clicked');
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
            🏠 Home
          </button>
        </div>
        
        <div style={{ background: '#e8f5e8', padding: '15px', borderRadius: '5px' }}>
          <p><strong>Navigation Test Successful! 🎉</strong></p>
          <p>• User Management page is working</p>
          <p>• Navigation between admin pages is functional</p>
          <p>• URL: {window.location.href}</p>
        </div>
      </div>
    </div>
  );
};

export default TestAdminUserManagement;
