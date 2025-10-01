import { useState } from "react";
import AuctionCard from "../components/AuctionCard";
import { useQuery } from "@tanstack/react-query";
import { getAuctions, getMyAuctions } from "../api/auction";
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
            {isSellerView ? 'Your Auctions' : 'All Auctions'}
          </h1>
          <p className="text-gray-600">
            {isSellerView 
              ? 'Manage your auction listings and track their performance' 
              : 'Discover and bid on amazing items from various sellers'
            }
          </p>
        </div>

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
