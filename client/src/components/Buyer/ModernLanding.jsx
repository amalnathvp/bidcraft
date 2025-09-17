import React from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getAuctions } from "../../api/auction.js";

export const ModernLanding = () => {
  const { data: auctions, isLoading } = useQuery({
    queryKey: ["featuredAuctions"],
    queryFn: getAuctions,
  });

  const featuredAuction = auctions?.[0]; // Get the first auction as featured

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-orange-900">BidCraft</h1>
              <span className="ml-2 text-sm text-gray-600 italic">Authentic Handicrafts</span>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-orange-600 font-medium">Home</Link>
              <Link to="/buyer/live-auctions" className="text-gray-700 hover:text-orange-600">Live Auctions</Link>
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
                to="/buyer/live-auctions"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
              >
                Start Bidding
              </Link>
              <Link 
                to="/buyer/live-auctions"
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
                    src={featuredAuction.itemPhoto || "/api/placeholder/600/400"} 
                    alt={featuredAuction.itemName}
                    className="w-full h-80 object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      LIVE AUCTION
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {featuredAuction.itemName}
                  </h3>
                  <p className="text-white text-lg">Collection</p>
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
      </main>
    </div>
  );
};