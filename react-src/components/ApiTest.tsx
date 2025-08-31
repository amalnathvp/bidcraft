/**
 * Debug component to test API endpoints and display raw data
 * This helps verify that the backend API is working correctly
 */

import React, { useState, useEffect } from 'react';

const ApiTest: React.FC = () => {
  const [categoriesData, setCategoriesData] = useState<any>(null);
  const [auctionsData, setAuctionsData] = useState<any>(null);
  const [featuredData, setFeaturedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
