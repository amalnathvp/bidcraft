import React, { useState, useMemo, useRef, useEffect } from "react";
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

// Search Bar Component with Recommendations
const SearchBar = ({ onSearch, auctions, isSellerRoute }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const searchRef = useRef(null);

  // Handicraft categories for recommendations
  const categories = [
    "all",
    "Pottery & Ceramics",
    "Woodcraft & Carving",
    "Textiles & Weaving",
    "Metalwork & Jewelry",
    "Glass Art & Stained Glass",
    "Leather Craft",
    "Paper Craft & Origami",
    "Traditional Paintings",
    "Embroidery & Needlework",
    "Other Handicrafts"
  ];

  // Get search recommendations based on current auctions
  const getRecommendations = useMemo(() => {
    if (!auctions || searchTerm.length < 1) return [];
    
    const suggestions = new Set();
    
    auctions.forEach(auction => {
      // Add item names that match search
      if (auction.itemName?.toLowerCase().includes(searchTerm.toLowerCase())) {
        suggestions.add(auction.itemName);
      }
      
      // Add categories that match
      if (auction.itemCategory?.toLowerCase().includes(searchTerm.toLowerCase())) {
        suggestions.add(auction.itemCategory);
      }
      
      // Add seller names for buyer routes
      if (!isSellerRoute && auction.sellerName?.toLowerCase().includes(searchTerm.toLowerCase())) {
        suggestions.add(`by ${auction.sellerName}`);
      }
    });
    
    // Add matching categories from our predefined list
    categories.forEach(category => {
      if (category !== "all" && category.toLowerCase().includes(searchTerm.toLowerCase())) {
        suggestions.add(category);
      }
    });
    
    return Array.from(suggestions).slice(0, 5);
  }, [searchTerm, auctions, isSellerRoute]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowRecommendations(value.length > 0);
    onSearch(value, selectedCategory);
  };

  // Handle category change
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    onSearch(searchTerm, category);
  };

  // Handle recommendation click
  const handleRecommendationClick = (recommendation) => {
    setSearchTerm(recommendation);
    setShowRecommendations(false);
    onSearch(recommendation, selectedCategory);
  };

  // Handle click outside to close recommendations
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowRecommendations(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="mb-8">
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        {/* Search Input */}
        <div className="relative" ref={searchRef}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder={isSellerRoute ? "Search your auctions..." : "Search auctions by name, category, or seller..."}
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => setShowRecommendations(searchTerm.length > 0)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Search Recommendations Dropdown */}
          {showRecommendations && getRecommendations.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Suggestions
                </div>
                {getRecommendations.map((recommendation, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecommendationClick(recommendation)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
                  >
                    <div className="flex items-center">
                      <svg className="h-4 w-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="text-gray-700">{recommendation}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category:</label>
          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 6).map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === "all" ? "All Categories" : category}
              </button>
            ))}
            {categories.length > 6 && (
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">More categories...</option>
                {categories.slice(6).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Search Results Info */}
        {searchTerm && (
          <div className="mt-3 text-sm text-gray-600">
            <span className="inline-flex items-center">
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Searching for: "<strong>{searchTerm}</strong>"
              {selectedCategory !== "all" && ` in ${selectedCategory}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
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
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
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
  const baseAuctions = React.useMemo(() => {
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

  // Apply search and category filters
  const filteredAuctions = useMemo(() => {
    if (!baseAuctions) return [];
    
    let filtered = baseAuctions;
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(auction => {
        return (
          auction.itemName?.toLowerCase().includes(searchLower) ||
          auction.itemDescription?.toLowerCase().includes(searchLower) ||
          auction.itemCategory?.toLowerCase().includes(searchLower) ||
          (!isSellerRoute && auction.sellerName?.toLowerCase().includes(searchLower))
        );
      });
    }
    
    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(auction => 
        auction.itemCategory === selectedCategory
      );
    }
    
    return filtered;
  }, [baseAuctions, searchTerm, selectedCategory, isSellerRoute]);

  // Handle search function
  const handleSearch = (term, category) => {
    setSearchTerm(term);
    setSelectedCategory(category);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm("");
    setSelectedCategory("all");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!isSellerRoute && <BuyerNavbar />}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isSellerRoute ? 'Your Auctions' : 'Live Auctions'}
            {isSellerRoute && baseAuctions && (
              <span className="text-lg font-normal text-gray-500 ml-2">({baseAuctions.length} total)</span>
            )}
          </h1>
          <p className="text-gray-600">
            {isSellerRoute 
              ? 'Manage all your auction listings. Active auctions are highlighted.'
              : 'Don\'t miss out on these exceptional pieces'
            }
          </p>
          {isSellerRoute && baseAuctions && baseAuctions.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-800 text-sm">
                📊 <strong>Quick Stats:</strong> {baseAuctions.reduce((total, auction) => total + (auction.bidCount || 0), 0)} total bids across all active auctions
              </p>
            </div>
          )}
        </div>

        {/* Search Bar */}
        {!isLoading && baseAuctions && baseAuctions.length > 0 && (
          <SearchBar 
            onSearch={handleSearch} 
            auctions={baseAuctions} 
            isSellerRoute={isSellerRoute}
          />
        )}

        {/* Search Results Summary */}
        {(searchTerm || selectedCategory !== "all") && !isLoading && (
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-800 font-medium">
                  {filteredAuctions.length} auction{filteredAuctions.length !== 1 ? 's' : ''} found
                  {searchTerm && ` for "${searchTerm}"`}
                  {selectedCategory !== "all" && ` in ${selectedCategory}`}
                </p>
              </div>
              <button
                onClick={clearSearch}
                className="text-yellow-600 hover:text-yellow-800 text-sm font-medium flex items-center"
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear filters
              </button>
            </div>
          </div>
        )}

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
        {filteredAuctions && filteredAuctions.length > 0 && (
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
              {filteredAuctions.map((auction) => (
                <AuctionCard key={auction._id} auction={auction} isSellerRoute={isSellerRoute} />
              ))}
            </div>
          </>
        )}

        {/* Empty State - No Search Results */}
        {(searchTerm || selectedCategory !== "all") && filteredAuctions && filteredAuctions.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h3>
            <p className="text-gray-600 mb-6">
              No auctions match your search criteria. Try adjusting your search terms or category filter.
            </p>
            <button
              onClick={clearSearch}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Empty State - No Auctions */}
        {baseAuctions && baseAuctions.length === 0 && !searchTerm && selectedCategory === "all" && (
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