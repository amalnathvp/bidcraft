import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AdminRegistration: React.FC = () => {
  const { register } = useAuth();
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const createAdmin = async () => {
    setIsLoading(true);
    setMessage('Creating admin user...');
    
    try {
      await register({
        name: 'Admin User',
        email: 'admin@bidcraft.com',
        password: 'Admin123',
        role: 'admin'
      });
      
      setMessage('✅ Admin user created successfully! You can now login with admin@bidcraft.com / Admin123');
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Admin User Setup</h2>
      <p>Click the button below to create the admin user for testing:</p>
      
      <button 
        onClick={createAdmin}
        disabled={isLoading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#8B4513',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {isLoading ? 'Creating...' : 'Create Admin User'}
      </button>
      
      {message && (
        <div style={{
          padding: '10px',
          backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
          color: message.includes('✅') ? '#155724' : '#721c24',
          borderRadius: '4px',
          marginTop: '10px'
        }}>
          {message}
        </div>
      )}
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h3>Test Credentials:</h3>
        <p><strong>Email:</strong> admin@bidcraft.com</p>
        <p><strong>Password:</strong> Admin123</p>
        <p><strong>Role:</strong> admin</p>
        <p><strong>Admin URL:</strong> <a href="/admin">http://localhost:3000/admin</a></p>
      </div>
    </div>
  );
};

export default AdminRegistration;
