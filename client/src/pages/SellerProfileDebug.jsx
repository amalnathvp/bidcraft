import React from 'react';
import { useSellerAuth } from '../contexts/SellerAuthContext.jsx';

export const SellerProfile = () => {
  const authContext = useSellerAuth();
  
  // Simple debug render to see what's in the context
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Seller Profile Debug</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Authentication Context Debug</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify({
              isLoading: authContext.isLoading,
              isAuthenticated: authContext.isAuthenticated,
              hasError: !!authContext.error,
              errorMessage: authContext.error?.message,
              hasSeller: !!authContext.seller,
              hasUser: !!authContext.seller?.user,
              userData: authContext.seller?.user ? {
                id: authContext.seller.user._id,
                name: authContext.seller.user.name,
                email: authContext.seller.user.email,
                role: authContext.seller.user.role
              } : null
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>
          <div className="space-x-4">
            <button 
              onClick={authContext.refreshAuth}
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
              onClick={() => window.location.href = '/seller'}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerProfile;