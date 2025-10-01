import React from 'react';
import { useSellerAuth } from '../contexts/SellerAuthContext.jsx';

export const TestAuth = () => {
  const { seller, isAuthenticated, isLoading, error, refreshAuth } = useSellerAuth();
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Authentication Test Page</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Authentication State</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded">
              <h3 className="font-semibold">Loading State:</h3>
              <p className={`text-lg ${isLoading ? 'text-yellow-600' : 'text-green-600'}`}>
                {isLoading ? '⏳ Loading...' : '✅ Loaded'}
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded">
              <h3 className="font-semibold">Authentication Status:</h3>
              <p className={`text-lg ${isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
                {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
              </p>
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 rounded border border-red-200">
                <h3 className="font-semibold text-red-800">Error:</h3>
                <p className="text-red-700">{error.message}</p>
              </div>
            )}
            
            <div className="p-4 bg-gray-50 rounded">
              <h3 className="font-semibold">Seller Information:</h3>
              {seller?.user ? (
                <div className="mt-2 space-y-2">
                  <p><span className="font-medium">ID:</span> {seller.user._id}</p>
                  <p><span className="font-medium">Name:</span> {seller.user.name}</p>
                  <p><span className="font-medium">Email:</span> {seller.user.email}</p>
                  <p><span className="font-medium">Role:</span> {seller.user.role}</p>
                </div>
              ) : (
                <p className="text-gray-500 mt-2">No seller data available</p>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 rounded">
              <h3 className="font-semibold">Local Storage:</h3>
              <pre className="text-sm mt-2 p-2 bg-white rounded border overflow-auto">
                {localStorage.getItem('sellerAuth') || 'No auth data in localStorage'}
              </pre>
            </div>
            
            <div className="p-4 bg-gray-50 rounded">
              <h3 className="font-semibold">Actions:</h3>
              <div className="space-x-4 mt-2">
                <button 
                  onClick={refreshAuth}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Refresh Auth
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Reload Page
                </button>
                <button 
                  onClick={() => window.location.href = '/login'}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Go to Login
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h3 className="font-semibold text-yellow-800">Instructions:</h3>
          <p className="text-yellow-700 mt-1">
            This page shows the current authentication state. If you're seeing issues with session recognition:
          </p>
          <ol className="list-decimal list-inside mt-2 text-yellow-700 space-y-1">
            <li>Check if you're authenticated and seller data is loaded</li>
            <li>Verify the seller ID remains consistent across page refreshes</li>
            <li>Use "Refresh Auth" to manually trigger authentication check</li>
            <li>Check browser console for additional debug information</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default TestAuth;