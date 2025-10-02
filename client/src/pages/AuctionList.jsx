import { useState } from "react";
import AuctionCard from "../components/AuctionCard";
import { useQuery } from "@tanstack/react-query";
import { getAuctions, getMyAuctions } from "../api/auction";
import { getBidStatistics } from "../api/bid";
import { useLocation, Link } from "react-router";
import { useSellerAuth } from "../contexts/SellerAuthContext.jsx";
import LoadingScreen from "../components/LoadingScreen";

export const AuctionList = () => {
  const [filter, setFilter] = useState("all");
  const location = useLocation();
  const { isAuthenticated } = useSellerAuth();
  const isSellerView = location.pathname.startsWith('/seller');
  
  // Fetch all auctions for buyers or seller's auctions for sellers
  const { data, isLoading } = useQuery({
    queryKey: isSellerView ? ["myAuctions"] : ["allAuction"],
    queryFn: isSellerView ? getMyAuctions : getAuctions,
    enabled: isSellerView ? isAuthenticated : true,
    staleTime: 30 * 1000,
  });

  // Fetch seller profile data for dashboard stats (seller view only)
  const { data: profileData } = useQuery({
    queryKey: ['sellerProfile'],
    queryFn: async () => {
      const response = await fetch('/user/profile', {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
    enabled: isSellerView && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch bid statistics (seller view only)
  const { data: bidStats } = useQuery({
    queryKey: ['bidStatistics'],
    queryFn: getBidStatistics,
    enabled: isSellerView && isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  if (isLoading) return <LoadingScreen />;

  const categories = [
    "all",
    ...new Set(data?.map((auction) => auction.itemCategory)),
  ];
  const filteredAuctions =
    filter === "all"
      ? data
      : data?.filter((auction) => auction.itemCategory === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isSellerView ? 'Seller Dashboard' : 'All Auctions'}
          </h1>
          <p className="text-gray-600">
            {isSellerView 
              ? 'Manage your auction listings and track their performance' 
              : 'Discover and bid on amazing items from various sellers'
            }
          </p>
        </div>

        {/* Dashboard Stats (Seller View Only) */}
        {isSellerView && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Total Auctions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">📋</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Auctions</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {profileData?.user?.stats?.totalAuctions || data?.length || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Auctions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 font-semibold">🟢</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Auctions</p>
                    <p className="text-2xl font-bold text-green-600">
                      {profileData?.user?.stats?.activeAuctions || 
                       data?.filter(auction => new Date(auction.itemEndDate) > new Date()).length || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Bids */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 font-semibold">🎯</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Bids</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {bidStats?.totalBids || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Bid Value */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="text-orange-600 font-semibold">💰</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Bid Value</p>
                    <p className="text-2xl font-bold text-orange-600">
                      ${bidStats?.totalBidValue?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Completed Auctions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <span className="text-indigo-600 font-semibold">✅</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed Auctions</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {profileData?.user?.stats?.completedAuctions || 
                       data?.filter(auction => new Date(auction.itemEndDate) <= new Date()).length || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Average Bid */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                      <span className="text-teal-600 font-semibold">📊</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Average Bid</p>
                    <p className="text-2xl font-bold text-teal-600">
                      ${bidStats?.averageBidAmount?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Unique Bidders */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                      <span className="text-pink-600 font-semibold">👥</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Unique Bidders</p>
                    <p className="text-2xl font-bold text-pink-600">
                      {bidStats?.uniqueBidders || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-4">
                <Link 
                  to="/seller/create" 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create New Auction
                </Link>
                <Link 
                  to="/seller/bids" 
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  View All Bids
                </Link>
                <Link 
                  to="/seller/profile" 
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Edit Profile
                </Link>
                <Link 
                  to="/seller/notifications" 
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  View Notifications
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">
            Filter by Category
          </h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === category
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {isSellerView 
              ? (filter === "all" ? "Your Auctions" : `Your ${filter} Auctions`)
              : (filter === "all" ? "All Auctions" : `${filter} Auctions`)
            }
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({filteredAuctions?.length || 0} items)
            </span>
          </h2>
        </div>

        {!filteredAuctions || filteredAuctions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-md shadow-sm border border-gray-200">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {isSellerView ? 'No auctions created yet' : 'No auctions found'}
              </h3>
              <p className="text-gray-600 mb-6">
                {isSellerView 
                  ? filter === 'all'
                    ? 'You haven\'t created any auctions yet. Start by creating your first auction!'
                    : `You don't have any auctions in the "${filter}" category yet.`
                  : filter === 'all'
                    ? 'No auctions are currently available. Check back later!'
                    : `No auctions found in the "${filter}" category.`
                }
              </p>
              {isSellerView && (
                <Link 
                  to="/seller/create" 
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Create Your First Auction
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 place-items-center gap-6">
            {filteredAuctions.map((auction) => (
              <AuctionCard key={auction._id} auction={auction} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
