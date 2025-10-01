import AuctionCard from "../components/AuctionCard.jsx";
import { Link, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { dashboardStats, getMyAuctions } from "../api/auction.js";
import { useSellerAuth } from "../contexts/SellerAuthContext.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx";

const Dashboard = () => {
  const location = useLocation();
  const { seller, isAuthenticated } = useSellerAuth();
  const isSellerView = location.pathname.startsWith('/seller');
  
  const { data, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => dashboardStats(),
    staleTime: 30 * 1000,
  });

  // For seller view, get only their auctions
  const { data: sellerAuctions, isLoading: isSellerAuctionsLoading } = useQuery({
    queryKey: ["myAuctions"],
    queryFn: () => getMyAuctions(),
    enabled: isSellerView && isAuthenticated,
    staleTime: 30 * 1000,
  });

  if (isLoading || (isSellerView && isSellerAuctionsLoading)) return <LoadingScreen />;

  return (
    <div className="bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">
              {isSellerView ? 'Your Total Auctions' : 'Total Auctions'}
            </h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {isSellerView ? data.userAuctionCount : data.totalAuctions}
            </p>
          </div>
          <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">
              {isSellerView ? 'Your Active Auctions' : 'Active Auctions'}
            </h3>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {isSellerView ? sellerAuctions?.filter(auction => {
                const isActive = Math.max(0, new Date(auction.itemEndDate) - new Date()) > 0;
                return isActive;
              }).length || 0 : data.activeAuctions}
            </p>
          </div>
          <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">
              {isSellerView ? 'Total Bids Received' : 'Your Auctions'}
            </h3>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {isSellerView ? sellerAuctions?.reduce((total, auction) => total + (auction.bidCount || auction.bidsCount || 0), 0) || 0 : data.userAuctionCount}
            </p>
          </div>
        </div>

        {/* Seller's Auctions Section (replaces All Auctions for sellers) */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isSellerView ? 'Your Auctions' : 'All Auctions'}
            </h2>
            <Link
              to={isSellerView ? "/seller/myauction" : "/auction"}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline"
            >
              View More
            </Link>
          </div>

          {(isSellerView ? sellerAuctions?.length === 0 : data.latestAuctions.length === 0) ? (
            <div className="text-center py-12 bg-white rounded-sm shadow-sm border border-gray-200">
              <p className="text-gray-500 text-lg">
                {isSellerView ? 'You haven\'t created any auctions yet.' : 'No auctions available at the moment.'}
              </p>
              {isSellerView && (
                <Link to="/seller/create">
                  <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-sm hover:bg-blue-700 transition-colors">
                    Create Your First Auction
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 place-items-center gap-4">
              {(isSellerView ? sellerAuctions?.slice(0, 6) : data.latestAuctions).map((auction) => (
                <AuctionCard key={auction._id} auction={auction} />
              ))}
            </div>
          )}
        </div>

        {/* Your Auctions Section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Auctions</h2>
            <Link
              to="/myauction"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline"
            >
              View More
            </Link>
          </div>

          {data.latestUserAuctions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-sm shadow-sm border border-gray-200">
              <p className="text-gray-500 text-lg">
                You haven't created any auctions yet.
              </p>{" "}
              <Link to="/create">
                <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-sm hover:bg-blue-700 transition-colors">
                  Create Your First Auction
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 place-items-center gap-4">
              {data.latestUserAuctions.map((auction) => (
                <AuctionCard key={auction._id} auction={auction} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
