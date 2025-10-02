import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { BuyerNavbar } from './BuyerNavbar';
import { useBuyerAuth } from '../../contexts/BuyerAuthContext';
import LoadingScreen from '../LoadingScreen';

// API functions
const getWatchlist = async () => {
  const response = await fetch('/api/buyer/auction/watchlist', {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch watchlist');
  }
  
  const data = await response.json();
  return data.watchlist || [];
};

const removeFromWatchlist = async (auctionId) => {
  const response = await fetch(`/api/buyer/auction/watchlist/${auctionId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to remove from watchlist');
  }
  
  return response.json();
};

export const SavedItems = () => {
  const { isAuthenticated, buyer } = useBuyerAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'ended'

  // Fetch watchlist
  const { data: watchlist = [], isLoading, error } = useQuery({
    queryKey: ['watchlist'],
    queryFn: getWatchlist,
    enabled: isAuthenticated,
  });

  // Remove from watchlist mutation
  const removeMutation = useMutation({
    mutationFn: removeFromWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });

  // Filter watchlist based on auction status
  const filteredWatchlist = watchlist.filter(item => {
    if (filter === 'active') {
      return new Date(item.itemEndDate) > new Date();
    } else if (filter === 'ended') {
      return new Date(item.itemEndDate) <= new Date();
    }
    return true; // 'all'
  });

  const handleRemoveFromWatchlist = (auctionId) => {
    if (window.confirm('Are you sure you want to remove this item from your saved list?')) {
      removeMutation.mutate(auctionId);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BuyerNavbar />
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view your saved items.</p>
          <Link to="/buyer/login" className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BuyerNavbar />
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Saved Items</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BuyerNavbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Saved Items</h1>
          <p className="text-gray-600">
            Items you're watching • {watchlist.length} total
          </p>
        </div>

        {/* Filter buttons */}
        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'all'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All ({watchlist.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'active'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Active ({watchlist.filter(item => new Date(item.itemEndDate) > new Date()).length})
          </button>
          <button
            onClick={() => setFilter('ended')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'ended'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Ended ({watchlist.filter(item => new Date(item.itemEndDate) <= new Date()).length})
          </button>
        </div>

        {/* Saved items grid */}
        {filteredWatchlist.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'No saved items yet' : `No ${filter} saved items`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? 'Start browsing auctions and save items you\'re interested in!'
                : `You don't have any ${filter} saved items.`
              }
            </p>
            <Link to="/live-auctions" className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700">
              Browse Auctions
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredWatchlist.map((item) => {
              const isEnded = new Date(item.itemEndDate) <= new Date();
              const timeLeft = new Date(item.itemEndDate) - new Date();
              const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
              const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

              return (
                <div key={item._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Image */}
                  <div className="relative">
                    <img
                      src={item.itemPhotos?.[0] || '/placeholder-auction.jpg'}
                      alt={item.itemName}
                      className="w-full h-48 object-cover"
                    />
                    {isEnded && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-sm font-medium">
                        Ended
                      </div>
                    )}
                    {!isEnded && daysLeft <= 1 && (
                      <div className="absolute top-2 right-2 bg-orange-600 text-white px-2 py-1 rounded text-sm font-medium">
                        Ending Soon
                      </div>
                    )}
                    
                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveFromWatchlist(item._id)}
                      disabled={removeMutation.isPending}
                      className="absolute top-2 left-2 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 disabled:opacity-50"
                      title="Remove from saved"
                    >
                      <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      </svg>
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {item.itemName}
                    </h3>
                    
                    <div className="text-lg font-bold text-green-600 mb-2">
                      ₹{item.currentPrice > 0 ? item.currentPrice : item.startingPrice}
                      {item.bidCount > 0 && (
                        <span className="text-sm text-gray-600 font-normal ml-2">
                          ({item.bidCount} bids)
                        </span>
                      )}
                    </div>

                    {!isEnded ? (
                      <div className="text-sm text-gray-600 mb-3">
                        {daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h left` : `${hoursLeft}h left`}
                      </div>
                    ) : (
                      <div className="text-sm text-red-600 mb-3">
                        Auction ended
                      </div>
                    )}

                    <Link
                      to={`/auction/${item._id}`}
                      className="block w-full bg-orange-600 text-white text-center py-2 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};