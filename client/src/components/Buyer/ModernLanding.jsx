import React from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getBuyerAuctions } from "../../api/buyerAuction.js";
import { BuyerNavbar } from "./BuyerNavbar.jsx";
import { FaClock, FaArrowRight } from "react-icons/fa";

const formatTimeLeft = (endDate) => {
  if (!endDate) return "Invalid date";
  
  const now = new Date();
  const end = new Date(endDate);
  
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

const AuctionCard = ({ auction }) => {
  const displayImage = auction.itemPhotos && auction.itemPhotos.length > 0 
    ? auction.itemPhotos[0] 
    : auction.itemPhoto || "/api/placeholder/400/300";
  
  const imageCount = auction.itemPhotos ? auction.itemPhotos.length : (auction.itemPhoto ? 1 : 0);
  
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative">
        <img
          src={displayImage}
          alt={auction.itemName}
          className="w-full h-48 object-cover"
        />
        {imageCount > 1 && (
          <div className="absolute top-3 left-3 bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-xs">
            +{imageCount - 1} more
          </div>
        )}
        <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
          <FaClock className="inline h-3 w-3 mr-1" />
          {formatTimeLeft(auction.itemEndDate)}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 text-lg">
          {auction.itemName}
        </h3>
        <p className="text-gray-600 text-sm mb-3">
          by {auction.sellerName || auction.seller?.name || 'Unknown Seller'}
        </p>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">Current Bid</p>
            <p className="text-xl font-bold text-orange-600">₹{auction.currentPrice}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Bids</p>
            <p className="text-sm font-semibold text-gray-700">{auction.bidCount || 0}</p>
          </div>
        </div>
        <Link to={`/auction/${auction._id}`}>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors">
            Place Bid
          </button>
        </Link>
      </div>
    </div>
  );
};

export const ModernLanding = () => {
  const { data: auctions, isLoading } = useQuery({
    queryKey: ["featuredAuctions"],
    queryFn: getBuyerAuctions,
  });

  const featuredAuction = auctions?.[0]; // Get the first auction as featured
  const displayAuctions = auctions?.slice(1, 9) || []; // Show next 8 auctions after featured

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <BuyerNavbar />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Discover Authentic{" "}
                <span className="text-orange-600">Handicrafts</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 leading-relaxed">
                Join the premier auction platform for authentic handcrafted treasures. 
                Bid on unique pieces created by skilled artisans from around the world.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/live-auctions"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
              >
                Start Bidding
              </Link>
              <Link 
                to="/live-auctions"
                className="border-2 border-orange-600 text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors text-center"
              >
                Explore Auctions
              </Link>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-8 pt-8">
              <div>
                <div className="text-3xl font-bold text-orange-600">10,000<span className="text-orange-400">+</span></div>
                <div className="text-gray-600 text-sm">Unique Items</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600">5,000<span className="text-orange-400">+</span></div>
                <div className="text-gray-600 text-sm">Happy Bidders</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600">500<span className="text-orange-400">+</span></div>
                <div className="text-gray-600 text-sm">Artisans</div>
              </div>
            </div>
          </div>

          {/* Right Content - Featured Auction */}
          <div className="relative">
            {featuredAuction ? (
              <div className="bg-black rounded-2xl overflow-hidden shadow-2xl">
                <div className="relative">
                  <img 
                    src={featuredAuction.itemPhotos && featuredAuction.itemPhotos.length > 0 ? featuredAuction.itemPhotos[0] : featuredAuction.itemPhoto || "/api/placeholder/600/400"} 
                    alt={featuredAuction.itemName}
                    className="w-full h-80 object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      LIVE AUCTION
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    <FaClock className="inline h-3 w-3 mr-1" />
                    {formatTimeLeft(featuredAuction.itemEndDate)}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {featuredAuction.itemName}
                  </h3>
                  <p className="text-orange-400 text-lg mb-2">
                    by {featuredAuction.sellerName || featuredAuction.seller?.name || 'Featured Artisan'}
                  </p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-300 text-sm">Current Bid</p>
                      <p className="text-2xl font-bold text-orange-400">₹{featuredAuction.currentPrice}</p>
                    </div>
                    <Link to={`/auction/${featuredAuction._id}`}>
                      <button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                        Bid Now
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-black rounded-2xl overflow-hidden shadow-2xl">
                <div className="relative">
                  <div className="w-full h-80 bg-gray-800 flex items-center justify-center">
                    <span className="text-white">Loading featured auction...</span>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      LIVE AUCTION
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Artisan Pottery
                  </h3>
                  <p className="text-white text-lg">Collection</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Auctions Section */}
        <section className="mt-20">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Live Auctions</h2>
              <p className="text-gray-600">Discover unique handcrafted treasures</p>
            </div>
            <Link 
              to="/live-auctions"
              className="text-orange-600 hover:text-orange-700 font-semibold flex items-center"
            >
              View All <FaArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                  <div className="w-full h-48 bg-gray-300"></div>
                  <div className="p-5">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded mb-4 w-2/3"></div>
                    <div className="flex justify-between items-center mb-4">
                      <div className="h-6 bg-gray-300 rounded w-20"></div>
                      <div className="h-4 bg-gray-300 rounded w-12"></div>
                    </div>
                    <div className="h-8 bg-gray-300 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : displayAuctions.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {displayAuctions.map((auction) => (
                  <AuctionCard key={auction._id} auction={auction} />
                ))}
              </div>
              
              {auctions && auctions.length > 9 && (
                <div className="text-center mt-10">
                  <p className="text-gray-600 mb-4">
                    Showing 8 of {auctions.length - 1} live auctions
                  </p>
                  <Link
                    to="/live-auctions"
                    className="inline-flex items-center px-8 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Explore All Auctions <FaArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🏺</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Live Auctions</h3>
              <p className="text-gray-600 mb-6">Check back soon for new handcrafted treasures!</p>
              <Link 
                to="/live-auctions"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Refresh Auctions
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};