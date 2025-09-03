/**
 * Debug component to test API endpoints and display raw data
 * This helps verify that the backend API is working correctly
 */

import React, { useState, useEffect } from 'react';
import { authService } from '../../src/services/auth';

const ApiTest: React.FC = () => {
  const [categoriesData, setCategoriesData] = useState<any>(null);
  const [auctionsData, setAuctionsData] = useState<any>(null);
  const [featuredData, setFeaturedData] = useState<any>(null);
  const [authData, setAuthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin login handler
  const handleAdminLogin = async () => {
    try {
      console.log('🚀 Testing dev admin login...');
      const response = await authService.devAdminLogin();
      setAuthData(response);
      console.log('✅ Dev admin login successful:', response);
    } catch (error) {
      console.error('❌ Dev admin login failed:', error);
      setAuthData({ error: error instanceof Error ? error.message : 'Login failed' });
    }
  };

  // Regular login test
  const handleRegularLogin = async () => {
    try {
      console.log('🔑 Testing regular admin login...');
      const response = await authService.login({
        email: 'admin@dev.local',
        password: 'any-password-works' // This will work due to our bypass
      });
      setAuthData(response);
      console.log('✅ Regular admin login successful:', response);
    } catch (error) {
      console.error('❌ Regular admin login failed:', error);
      setAuthData({ error: error instanceof Error ? error.message : 'Login failed' });
    }
  };

  // Logout handler
  const handleLogout = () => {
    authService.logout();
    setAuthData(null);
    console.log('🚪 Logged out');
  };

  useEffect(() => {
    const testAPIs = async () => {
      try {
        setLoading(true);
        
        // Test categories API
        console.log('Testing /api/categories...');
        const categoriesResponse = await fetch('/api/categories');
        const categoriesJson = await categoriesResponse.json();
        setCategoriesData(categoriesJson);
        console.log('Categories response:', categoriesJson);
        
        // Test auctions API
        console.log('Testing /api/auctions...');
        const auctionsResponse = await fetch('/api/auctions');
        const auctionsJson = await auctionsResponse.json();
        setAuctionsData(auctionsJson);
        console.log('Auctions response:', auctionsJson);
        
        // Test featured auctions API
        console.log('Testing /api/auctions/featured...');
        const featuredResponse = await fetch('/api/auctions/featured');
        const featuredJson = await featuredResponse.json();
        setFeaturedData(featuredJson);
        console.log('Featured auctions response:', featuredJson);
        
      } catch (err) {
        console.error('API Test Error:', err);
        setError(err instanceof Error ? err.message : 'API test failed');
      } finally {
        setLoading(false);
      }
    };

    testAPIs();
  }, []);

  if (loading) {
    return <div style={{ padding: '20px' }}>Testing APIs...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>API Test Results</h2>
      
      {/* Admin Login Test Section */}
      <div style={{ background: '#e8f5e8', padding: '15px', marginBottom: '20px', border: '1px solid #4caf50' }}>
        <h3>🔧 Development Admin Access</h3>
        <div style={{ marginBottom: '10px' }}>
          <button 
            onClick={handleAdminLogin}
            style={{ 
              background: '#4caf50', 
              color: 'white', 
              border: 'none', 
              padding: '10px 15px', 
              marginRight: '10px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🚀 Instant Admin Login
          </button>
          <button 
            onClick={handleRegularLogin}
            style={{ 
              background: '#2196f3', 
              color: 'white', 
              border: 'none', 
              padding: '10px 15px', 
              marginRight: '10px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔑 Regular Admin Login
          </button>
          <button 
            onClick={handleLogout}
            style={{ 
              background: '#f44336', 
              color: 'white', 
              border: 'none', 
              padding: '10px 15px',
              marginRight: '10px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🚪 Logout
          </button>
          <button 
            onClick={() => window.location.href = '/admin'}
            style={{ 
              background: '#9c27b0', 
              color: 'white', 
              border: 'none', 
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔗 Go to Admin Panel
          </button>
        </div>
        
        {authData && (
          <div>
            <h4>Auth Result:</h4>
            <pre style={{ background: '#f0f8ff', padding: '10px', overflow: 'auto', border: '1px solid #ddd' }}>
              {JSON.stringify(authData, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      <h3>Categories API (/api/categories)</h3>
      <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
        {JSON.stringify(categoriesData, null, 2)}
      </pre>
      
      <h3>Auctions API (/api/auctions)</h3>
      <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
        {JSON.stringify(auctionsData, null, 2)}
      </pre>
      
      <h3>Featured Auctions API (/api/auctions/featured)</h3>
      <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
        {JSON.stringify(featuredData, null, 2)}
      </pre>
    </div>
  );
};

export default ApiTest;
