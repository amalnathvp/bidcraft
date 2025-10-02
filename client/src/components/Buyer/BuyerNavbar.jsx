import React, { useState } from 'react';
import { Link } from 'react-router';
import { useBuyerAuth } from '../../contexts/BuyerAuthContext.jsx';

export const BuyerNavbar = () => {
  const { isAuthenticated, buyer, logout, isLoggingOut } = useBuyerAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-orange-900">BidCraft</h1>
              <span className="ml-2 text-sm text-gray-600 italic">Authentic Handicrafts</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-700 hover:text-orange-600">Home</Link>
            <Link to="/live-auctions" className="text-gray-700 hover:text-orange-600">Live Auctions</Link>
            {isAuthenticated && (
              <Link to="/saved" className="text-gray-700 hover:text-orange-600">Saved</Link>
            )}
            {!isAuthenticated && (
              <Link to="/login" className="text-gray-700 hover:text-orange-600">Sell</Link>
            )}
            <Link to="/about" className="text-gray-700 hover:text-orange-600">About</Link>
            <Link to="/contact" className="text-gray-700 hover:text-orange-600">Contact</Link>
          </nav>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-orange-600 focus:outline-none"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {buyer?.firstName?.charAt(0)?.toUpperCase() || buyer?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="font-medium">
                      {buyer?.firstName || buyer?.name?.split(' ')[0] || 'User'}
                    </span>
                    <svg 
                      className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {buyer?.firstName && buyer?.lastName 
                          ? `${buyer.firstName} ${buyer.lastName}`
                          : buyer?.name || 'User'
                        }
                      </p>
                      <p className="text-sm text-gray-500">{buyer?.email}</p>
                    </div>
                    
                    <Link
                      to="/buyer/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      My Profile
                    </Link>
                    
                    <Link
                      to="/buyer/bids"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      My Bids
                    </Link>
                    
                    <Link
                      to="/buyer/watchlist"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      Watchlist
                    </Link>
                    
                    <div className="border-t border-gray-100">
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      >
                        {isLoggingOut ? 'Signing out...' : 'Sign out'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link 
                  to="/buyer/login" 
                  className="text-gray-700 hover:text-orange-600 font-medium"
                >
                  Login
                </Link>
                <Link 
                  to="/buyer/signup" 
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </header>
  );
};