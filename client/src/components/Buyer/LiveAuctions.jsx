import React from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getAuctions } from "../../api/auction.js";

const BuyerHeader = () => (
  <header className="bg-white shadow-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-orange-900">BidCraft</h1>
          <span className="ml-2 text-sm text-gray-600 italic">Authentic Handicrafts</span>
        </div>
        
        <nav className="hidden md:flex space-x-8">
          <Link to="/buyer" className="text-gray-700 hover:text-orange-600">Home</Link>
          <Link to="/buyer/live-auctions" className="text-orange-600 font-medium">Live Auctions</Link>
          <Link to="/buyer/sell" className="text-gray-700 hover:text-orange-600">Sell</Link>
          <Link to="/buyer/categories" className="text-gray-700 hover:text-orange-600">Categories</Link>
          <Link to="/about" className="text-gray-700 hover:text-orange-600">About</Link>
          <Link to="/contact" className="text-gray-700 hover:text-orange-600">Contact</Link>
        </nav>

        <div className="flex items-center">
          <div className="relative">
            <button className="flex items-center text-sm bg-orange-100 rounded-full px-3 py-1 text-orange-800">
              <span className="mr-1">👤</span>
              arjun ad
              <span className="ml-1">▼</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
);

const formatTimeLeft = (endDate) => {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end - now;
  
  if (diff <= 0) return "Auction ended";
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
};

const AuctionCard = ({ auction }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
    <div className="relative">
      <img 
        src={auction.itemPhoto || "/api/placeholder/400/300"} 
        alt={auction.itemName}
        className="w-full h-64 object-cover"
      />
      <div className="absolute top-3 right-3">
        <span className="bg-red-600 text-white px-2 py-1 rounded text-sm font-medium">
          {formatTimeLeft(auction.itemEndDate)}
        </span>
      </div>
    </div>
    
    <div className="p-4">
      <h3 className="text-xl font-bold text-gray-900 mb-2">{auction.itemName}</h3>
      <p className="text-gray-600 text-sm mb-1">by {auction.sellerName}</p>
      
      <div className="flex justify-between items-center mt-4">
        <div>
          <p className="text-2xl font-bold text-gray-900">${auction.currentPrice}</p>
          <p className="text-sm text-gray-500">{auction.bidsCount} bids</p>
        </div>
        
        <Link 
          to={`/buyer/auction/${auction._id}`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Place Bid
        </Link>
      </div>
    </div>
  </div>
);

export const LiveAuctions = () => {
  const { data: auctions, isLoading, error } = useQuery({
    queryKey: ["liveAuctions"],
    queryFn: getAuctions,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <BuyerHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Auctions</h1>
          <p className="text-gray-600">Don't miss out on these exceptional pieces</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map((auction) => (
              <AuctionCard key={auction._id} auction={auction} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {auctions && auctions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏺</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Live Auctions</h3>
            <p className="text-gray-600 mb-6">There are no active auctions at the moment. Check back soon!</p>
            <Link 
              to="/buyer" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};