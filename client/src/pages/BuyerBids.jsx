import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBuyerAuth } from '../contexts/BuyerAuthContext.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';
import { useNavigate } from 'react-router';
import { getBuyerBids, deleteBuyerBid, getBuyerBidStatistics } from '../api/bid.js';
import { BuyerNavbar } from '../components/Buyer/BuyerNavbar.jsx';

// API functions for buyer bids - moved to api/bid.js

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatTimeLeft = (endDate) => {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end - now;
  
  if (diff <= 0) return 'Ended';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
};

const getBidStatus = (bid) => {
  const now = new Date();
  const endDate = new Date(bid.auction.itemEndDate);
  const isActive = endDate > now;
  
  if (!isActive) {
    // Auction ended
    if (bid.isWinning) {
      return { status: 'won', label: 'Won', color: 'bg-green-100 text-green-800 border-green-200', icon: '🏆' };
    } else {
      return { status: 'lost', label: 'Lost', color: 'bg-red-100 text-red-800 border-red-200', icon: '❌' };
    }
  } else {
    // Auction still active
    if (bid.isWinning) {
      return { status: 'winning', label: 'Winning', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '🔥' };
    } else {
      return { status: 'outbid', label: 'Outbid', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '⚠️' };
    }
  }
};

const BidCard = ({ bid, onDeleteBid, onViewAuction }) => {
  const navigate = useNavigate();
  const bidStatus = getBidStatus(bid);
  const isActive = new Date(bid.auction.itemEndDate) > new Date();

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        {/* Auction Image */}
        <div className="w-20 h-20 flex-shrink-0">
          <img
            src={bid.auction.itemPhotos?.[0] || bid.auction.itemPhoto || "https://picsum.photos/200"}
            alt={bid.auction.itemName}
            className="w-full h-full object-cover rounded-md cursor-pointer"
            onClick={() => navigate(`/auction/${bid.auction._id}`)}
          />
        </div>

        {/* Bid Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 
                className="text-lg font-semibold text-gray-900 truncate cursor-pointer hover:text-blue-600"
                onClick={() => navigate(`/auction/${bid.auction._id}`)}
              >
                {bid.auction.itemName}
              </h3>
              <p className="text-sm text-gray-600">{bid.auction.itemCategory}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${bidStatus.color}`}>
              <span className="mr-1">{bidStatus.icon}</span>
              {bidStatus.label}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500">My Bid</p>
              <p className="text-sm font-semibold text-blue-600">₹{bid.bidAmount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Current Price</p>
              <p className="text-sm font-medium text-gray-900">₹{bid.auction.currentPrice}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Bid Date</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(bid.bidTime)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Time Left</p>
              <p className={`text-sm font-medium ${isActive ? 'text-orange-600' : 'text-gray-500'}`}>
                {formatTimeLeft(bid.auction.itemEndDate)}
              </p>
            </div>
          </div>

          {/* Auction Progress */}
          <div className="bg-gray-50 rounded-md p-3 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-600">Starting Price: ₹{bid.auction.startingPrice}</span>
              <span className="text-xs text-gray-600">Total Bids: {bid.auction.bidCount || 0}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ 
                  width: `${Math.min(100, (bid.auction.currentPrice / (bid.auction.startingPrice * 2)) * 100)}%` 
                }}
              ></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/auction/${bid.auction._id}`)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              View Auction
            </button>
            
            {isActive && !bid.isWinning && (
              <button
                onClick={() => navigate(`/auction/${bid.auction._id}#bid-form`)}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Bid Again
              </button>
            )}
            
            {isActive && (
              <button
                onClick={() => onDeleteBid(bid._id)}
                className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors"
              >
                Withdraw Bid
              </button>
            )}
            
            <button
              onClick={() => onViewAuction(bid.auction)}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BidDetailsModal = ({ auction, isOpen, onClose }) => {
  if (!isOpen || !auction) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Auction Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Auction Image */}
          <div className="text-center">
            <img
              src={auction.itemPhotos?.[0] || auction.itemPhoto || "https://picsum.photos/400"}
              alt={auction.itemName}
              className="w-full max-w-md h-64 object-cover rounded-lg mx-auto"
            />
          </div>

          {/* Auction Info */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{auction.itemName}</h3>
            <p className="text-gray-600 mb-4">{auction.itemDescription}</p>
            
            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-medium">{auction.itemCategory}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Starting Price</p>
                <p className="font-medium">₹{auction.startingPrice}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Price</p>
                <p className="font-semibold text-green-600">₹{auction.currentPrice}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Bids</p>
                <p className="font-medium">{auction.bidCount || 0}</p>
              </div>
            </div>
          </div>

          {/* Time Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Timing Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-700">Auction Ends</p>
                <p className="font-medium text-blue-900">{formatDate(auction.itemEndDate)}</p>
              </div>
              <div>
                <p className="text-blue-700">Time Left</p>
                <p className="font-medium text-blue-900">{formatTimeLeft(auction.itemEndDate)}</p>
              </div>
            </div>
          </div>

          {/* Seller Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Seller Information</h4>
            <p className="text-gray-700">{auction.seller?.name || 'Seller Name'}</p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const BuyerBids = () => {
  const { isAuthenticated, isLoading: authLoading, buyer } = useBuyerAuth();
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['buyerBids', filterStatus],
    queryFn: () => getBuyerBids(1, filterStatus),
    enabled: isAuthenticated,
    retry: 3,
    retryDelay: 1000,
  });

  // Debug the received data
  React.useEffect(() => {
    if (data) {
      console.log('=== BUYER BIDS DATA ===');
      console.log('Total database bids:', data.totalBids);
      console.log('Bids with valid auction data:', data.bids?.filter(bid => bid.auction)?.length || 0);
      console.log('Current page data:', data.bids?.length || 0);
    }
  }, [data]);

  const deleteBidMutation = useMutation({
    mutationFn: deleteBuyerBid,
    onSuccess: () => {
      queryClient.invalidateQueries(['buyerBids']);
      alert('Bid withdrawn successfully!');
    },
    onError: (error) => {
      alert(error.message || 'Failed to withdraw bid');
    },
  });

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/buyer/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading || isLoading) return <LoadingScreen />;

  if (error) {
    console.error('Error loading bids:', error);
    return (
      <>
        <BuyerNavbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Error Loading Bids</h2>
            <p className="text-gray-500 mb-4">{error.message}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  // Handle the data structure properly
  const bids = data?.bids || [];
  const totalBids = data?.totalBids || 0;
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || 1;
  
  const handleDeleteBid = (bidId) => {
    if (window.confirm('Are you sure you want to withdraw this bid? This action cannot be undone.')) {
      deleteBidMutation.mutate(bidId);
    }
  };

  const handleViewDetails = (auction) => {
    setSelectedAuction(auction);
    setShowModal(true);
  };

  // Calculate statistics - handle potential missing auction data
  const validBids = bids.filter(bid => bid && bid.auction);
  const stats = {
    total: totalBids,
    active: validBids.filter(bid => {
      try {
        return getBidStatus(bid).status === 'active';
      } catch (e) {
        console.warn('Error calculating active status for bid:', bid, e);
        return false;
      }
    }).length,
    winning: validBids.filter(bid => {
      try {
        return getBidStatus(bid).status === 'winning';
      } catch (e) {
        console.warn('Error calculating winning status for bid:', bid, e);
        return false;
      }
    }).length,
    won: validBids.filter(bid => {
      try {
        return getBidStatus(bid).status === 'won';
      } catch (e) {
        console.warn('Error calculating won status for bid:', bid, e);
        return false;
      }
    }).length,
    outbid: validBids.filter(bid => {
      try {
        return getBidStatus(bid).status === 'outbid';
      } catch (e) {
        console.warn('Error calculating outbid status for bid:', bid, e);
        return false;
      }
    }).length,
    lost: validBids.filter(bid => {
      try {
        return getBidStatus(bid).status === 'lost';
      } catch (e) {
        console.warn('Error calculating lost status for bid:', bid, e);
        return false;
      }
    }).length,
  };

  return (
    <>
      <BuyerNavbar />
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bids</h1>
          <p className="text-gray-600">Track and manage your bidding activity</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Bids</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Active Bids</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.winning}</div>
            <div className="text-sm text-gray-600">Currently Winning</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.won}</div>
            <div className="text-sm text-gray-600">Auctions Won</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.outbid}</div>
            <div className="text-sm text-gray-600">Outbid</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.lost}</div>
            <div className="text-sm text-gray-600">Lost</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Bids', count: stats.total },
              { key: 'winning', label: 'Winning', count: stats.winning },
              { key: 'won', label: 'Won', count: stats.won },
              { key: 'outbid', label: 'Outbid', count: stats.outbid },
              { key: 'lost', label: 'Lost', count: stats.lost },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setFilterStatus(filter.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === filter.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>

        {/* Bids List */}
        {validBids.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🔨</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {totalBids === 0 
                ? (filterStatus === 'all' ? 'No Bids Yet' : `No ${filterStatus} Bids`)
                : 'No Valid Bids Found'
              }
            </h2>
            <p className="text-gray-600 mb-6">
              {totalBids === 0 
                ? (filterStatus === 'all' 
                  ? "You haven't placed any bids yet. Start bidding on auctions!"
                  : `You don't have any bids with ${filterStatus} status.`
                )
                : "Some bids may have missing auction data. Contact support if this persists."
              }
            </p>
            <div className="space-x-4">
              <button
                onClick={() => navigate('/live-auctions')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Browse Auctions
              </button>
              {totalBids > 0 && (
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  Refresh Page
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {validBids.map((bid) => {
              try {
                return (
                  <BidCard
                    key={bid._id}
                    bid={bid}
                    onDeleteBid={handleDeleteBid}
                    onViewAuction={handleViewDetails}
                  />
                );
              } catch (error) {
                console.error('Error rendering bid card:', bid, error);
                return (
                  <div key={bid._id || Math.random()} className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">Error displaying bid data for this item</p>
                    <button 
                      onClick={() => console.log('Problematic bid data:', bid)}
                      className="text-red-500 text-sm underline mt-2"
                    >
                      Debug Info (Check Console)
                    </button>
                  </div>
                );
              }
            })}
          </div>
        )}

        {/* Auction Details Modal */}
        <BidDetailsModal
          auction={selectedAuction}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      </div>
      </div>
    </>
  );
};