import React from "react";
import { Link, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getBuyerAuctions } from "../../api/buyerAuction.js";
import { getMyAuctions } from "../../api/auction.js";
import { useSellerAuth } from "../../contexts/SellerAuthContext.jsx";
import { BuyerNavbar } from "./BuyerNavbar.jsx";

const formatTimeLeft = (endDate) => {
  if (!endDate) return "Invalid date";
  
  const now = new Date();
  const end = new Date(endDate);
  
  // Check if the date is valid
  if (isNaN(end.getTime())) {
    console.warn('Invalid end date in formatTimeLeft:', endDate);
    return "Invalid date";
  }
  
  const diff = end - now;
  
  if (diff <= 0) return "Auction ended";
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
};

const AuctionCard = ({ auction, isSellerRoute = false }) => {
  // Get the first image or use placeholder
  const displayImage = auction.itemPhotos && auction.itemPhotos.length > 0 
    ? auction.itemPhotos[0] 
    : auction.itemPhoto || "/api/placeholder/400/300";
  
  const imageCount = auction.itemPhotos ? auction.itemPhotos.length : (auction.itemPhoto ? 1 : 0);
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <img 
          src={displayImage} 
          alt={auction.itemName}
          className="w-full h-64 object-cover"
        />
        {imageCount > 1 && (
          <div className="absolute top-3 left-3 bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-xs">
            +{imageCount - 1} more
          </div>
        )}
        <div className="absolute top-3 right-3">
        <span className="bg-red-600 text-white px-2 py-1 rounded text-sm font-medium">
          {formatTimeLeft(auction.itemEndDate)}
        </span>
      </div>
    </div>
    
    <div className="p-4">
      <h3 className="text-xl font-bold text-gray-900 mb-2">{auction.itemName}</h3>
      {!isSellerRoute && (
        <p className="text-gray-600 text-sm mb-1">by {auction.sellerName}</p>
      )}
      
      <div className="flex justify-between items-center mt-4">
        <div>
          <p className="text-2xl font-bold text-gray-900">₹{auction.currentPrice}</p>
          <p className="text-sm text-gray-500">
            {auction.bidCount || 0} bids
            {isSellerRoute && auction.bidCount > 0 && (
              <span className="ml-2 text-green-600 font-medium">
                💰 +₹{(auction.currentPrice - auction.startingPrice) || 0}
              </span>
            )}
          </p>
        </div>
        
        <Link 
          to={isSellerRoute ? `/seller/auction-detail/${auction._id}` : `/auction/${auction._id}`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {isSellerRoute ? "Manage Auction" : "Place Bid"}
        </Link>
      </div>
    </div>
  </div>
  );
};

export const LiveAuctions = () => {
  const location = useLocation();
  const { isAuthenticated: isSellerAuthenticated } = useSellerAuth();
  const isSellerRoute = location.pathname.includes('/seller/');
  
  // For seller routes, fetch their auctions; for buyer routes, fetch all auctions
  const { data: allAuctions, isLoading, error } = useQuery({
    queryKey: isSellerRoute ? ["myLiveAuctions"] : ["liveAuctions"],
    queryFn: isSellerRoute ? getMyAuctions : getBuyerAuctions,
    enabled: isSellerRoute ? isSellerAuthenticated : true,
  });

  // Add debug logging
  React.useEffect(() => {
    console.log('LiveAuctions Debug:', {
      isSellerRoute,
      isSellerAuthenticated,
      isLoading,
      error,
      allAuctions,
      auctionsCount: allAuctions?.length || 0
    });
  }, [isSellerRoute, isSellerAuthenticated, isLoading, error, allAuctions]);

  // Filter for only active auctions
  const auctions = React.useMemo(() => {
    if (!allAuctions) return [];
    
    // For debugging, let's see all auctions first
    console.log('All auctions from API:', allAuctions);
    
    const activeAuctions = allAuctions.filter(auction => {
      // Validate the end date
      if (!auction.itemEndDate) {
        console.warn('Auction missing itemEndDate:', auction.itemName);
        return false;
      }
      
      const endDate = new Date(auction.itemEndDate);
      const now = new Date();
      
      // Check if the date is valid
      if (isNaN(endDate.getTime())) {
        console.warn('Invalid date for auction:', auction.itemName, 'Date value:', auction.itemEndDate);
        return false;
      }
      
      const isActive = endDate > now;
      
      // Debug logging for seller routes (only for valid dates)
      if (isSellerRoute) {
        console.log('Auction filter check:', {
          itemName: auction.itemName,
          itemEndDate: auction.itemEndDate,
          endDate: endDate.toISOString(),
          now: now.toISOString(),
          isActive,
          timeLeft: endDate - now,
          daysDifference: (endDate - now) / (1000 * 60 * 60 * 24)
        });
      }
      
      return isActive;
    });
    
    // For debugging, temporarily return all auctions to see if any exist
    const resultAuctions = isSellerRoute ? allAuctions : activeAuctions;
    
    if (isSellerRoute) {
      console.log('Seller live auctions:', {
        total: allAuctions?.length || 0,
        active: activeAuctions.length,
        returned: resultAuctions.length,
        auctions: resultAuctions.map(a => ({ 
          name: a.itemName, 
          bids: a.bidCount || 0,
          endDate: a.itemEndDate,
          isActive: new Date(a.itemEndDate) > new Date()
        }))
      });
    }
    
    return resultAuctions;
  }, [allAuctions, isSellerRoute]);

  return (
    <div className="min-h-screen bg-gray-50">
      {!isSellerRoute && <BuyerNavbar />}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isSellerRoute ? 'Your Auctions' : 'Live Auctions'}
            {isSellerRoute && auctions && (
              <span className="text-lg font-normal text-gray-500 ml-2">({auctions.length} total)</span>
            )}
          </h1>
          <p className="text-gray-600">
            {isSellerRoute 
              ? 'Manage all your auction listings. Active auctions are highlighted.'
              : 'Don\'t miss out on these exceptional pieces'
            }
          </p>
          {isSellerRoute && auctions && auctions.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-800 text-sm">
                📊 <strong>Quick Stats:</strong> {auctions.reduce((total, auction) => total + (auction.bidCount || 0), 0)} total bids across all active auctions
              </p>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="w-full h-64 bg-gray-300"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded mb-4 w-2/3"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-6 bg-gray-300 rounded w-20"></div>
                    <div className="h-8 bg-gray-300 rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Failed to load auctions. Please try again.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Auctions Grid */}
        {auctions && auctions.length > 0 && (
          <>
            {isSellerRoute && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="text-green-800 font-semibold mb-2">🎯 Your Active Auctions</h3>
                <p className="text-green-700 text-sm">
                  These are your currently active auctions. Monitor bids and manage your listings below.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {auctions.map((auction) => (
                <AuctionCard key={auction._id} auction={auction} isSellerRoute={isSellerRoute} />
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {auctions && auctions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">{isSellerRoute ? '📦' : '🏺'}</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isSellerRoute ? 'No Auctions Found' : 'No Live Auctions'}
            </h3>
            <p className="text-gray-600 mb-6">
              {isSellerRoute 
                ? 'You haven\'t created any auctions yet. Start by creating your first auction!'
                : 'There are no active auctions at the moment. Check back soon!'
              }
            </p>
            <Link 
              to={isSellerRoute ? "/seller/create" : "/"} 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {isSellerRoute ? 'Create New Auction' : 'Back to Home'}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};