import AuctionCard from "../components/AuctionCard.jsx";
import { Link, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { dashboardStats, getMyAuctions } from "../api/auction.js";
import { useSellerAuth } from "../contexts/SellerAuthContext.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx";
import { 
  CiShop, CiGift
} from "react-icons/ci";
import { FaCheck, FaExclamationCircle, FaClock, FaEye } from "react-icons/fa";

// Fetch seller profile data for enhanced stats
const fetchSellerProfile = async () => {
  const response = await fetch('/user/profile', {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }
  return response.json();
};

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

  // Get seller profile data for enhanced stats
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ['sellerProfile'],
    queryFn: fetchSellerProfile,
    enabled: isSellerView && isAuthenticated,
    staleTime: 60 * 1000, // Cache for 1 minute
  });

  // Calculate enhanced seller statistics
  const calculateSellerStats = () => {
    // Provide default values even if data isn't fully loaded
    const user = profileData?.user;
    const stats = user?.stats || {};
    const auctions = sellerAuctions || [];
    
    console.log('Calculating seller stats with auctions:', auctions);
    
    const now = new Date();
    // Use timeLeft property to determine if auction is active (timeLeft > 0 means active)
    const activeAuctions = auctions.filter(auction => {
      const timeLeft = auction.timeLeft || 0;
      const endDate = new Date(auction.itemEndDate);
      const isActive = timeLeft > 0 || endDate > now;
      console.log(`Auction ${auction.itemName}: timeLeft=${timeLeft}, endDate=${endDate}, now=${now}, isActive=${isActive}`);
      return isActive;
    });
    
    const completedAuctions = auctions.filter(auction => {
      const timeLeft = auction.timeLeft || 0;
      const endDate = new Date(auction.itemEndDate);
      return timeLeft <= 0 && endDate <= now;
    });
    
    // Calculate total bids received (count) and total bid amounts
    const totalBidsReceived = auctions.reduce((total, auction) => {
      const bids = auction.bidCount || 0;
      console.log(`Auction ${auction.itemName}: bidCount=${bids}`);
      return total + bids;
    }, 0);
    
    // Calculate total revenue from all bid amounts
    const totalBidAmounts = auctions.reduce((total, auction) => {
      const bidAmount = auction.totalBidAmount || 0;
      console.log(`Auction ${auction.itemName}: totalBidAmount=${bidAmount}`);
      return total + bidAmount;
    }, 0);
    
    // Calculate average bid amount per auction
    const avgBidPerAuction = auctions.length > 0 ? (totalBidAmounts / auctions.length).toFixed(2) : 0;
    
    console.log('Total bids received:', totalBidsReceived);
    console.log('Total bid amounts (revenue):', totalBidAmounts);
    console.log('Average bid per auction:', avgBidPerAuction);
    
    // Calculate success rate (auctions with bids / total auctions)
    const auctionsWithBids = auctions.filter(auction => (auction.bidCount || 0) > 0);
    const successRate = auctions.length > 0 ? ((auctionsWithBids.length / auctions.length) * 100).toFixed(1) : 0;
    
    return {
      totalAuctions: auctions.length,
      activeAuctions: activeAuctions.length,
      completedAuctions: completedAuctions.length,
      totalBidsReceived: totalBidsReceived, // Total number of bids received
      totalRevenue: totalBidAmounts, // Total revenue from all bid amounts
      avgBidPerAuction: avgBidPerAuction, // Average bid amount per auction
      successRate,
      avgRating: stats.avgRating || 0,
      totalReviews: stats.totalReviews || 0,
      profileCompletion: user?.completionPercentage || 0,
      verified: user?.verified || false,
      memberSince: user?.signupAt,
      lastLogin: user?.lastLogin,
      hasData: true // Flag to indicate we have some data
    };
  };

  const sellerStats = isSellerView ? calculateSellerStats() : null;

  if (isLoading || (isSellerView && (isSellerAuctionsLoading || isProfileLoading))) return <LoadingScreen />;

  return (
    <div className="bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Enhanced Seller Dashboard Stats */}
        {isSellerView ? (
          <>
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg shadow-lg mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Welcome back, {seller?.name || 'Seller'}!</h1>
                  <p className="text-blue-100">Here's how your auctions are performing</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-2">
                    {sellerStats?.verified ? (
                      <><FaCheck className="text-green-300" /> <span className="text-sm">Verified Seller</span></>
                    ) : (
                      <><FaExclamationCircle className="text-yellow-300" /> <span className="text-sm">Pending Verification</span></>
                    )}
                  </div>
                  <div className="text-sm text-blue-100">
                    Profile: {sellerStats?.profileCompletion || 0}% Complete
                  </div>
                </div>
              </div>
            </div>

            {/* Main Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Total Auctions</h3>
                    <p className="text-3xl font-bold text-blue-600">{sellerStats?.totalAuctions || 0}</p>
                  </div>
                  <CiShop className="text-4xl text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Active Auctions</h3>
                    <p className="text-3xl font-bold text-green-600">{sellerStats?.activeAuctions || 0}</p>
                  </div>
                  <FaClock className="text-4xl text-green-500" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Completed Auctions</h3>
                    <p className="text-3xl font-bold text-purple-600">{sellerStats?.completedAuctions || 0}</p>
                  </div>
                  <FaCheck className="text-4xl text-purple-500" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Total Bids Received</h3>
                    <p className="text-3xl font-bold text-orange-600">{sellerStats?.totalBidsReceived || 0}</p>
                  </div>
                  <FaEye className="text-4xl text-orange-500" />
                </div>
              </div>
            </div>

            {/* Performance Stats Section - Matching the Screenshot */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <FaCheck className="text-blue-500" />
                Performance Stats
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Total Auctions */}
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <div className="text-sm font-medium text-gray-600 mb-1">Total Auctions</div>
                  <div className="text-2xl font-bold text-blue-600">{sellerStats?.totalAuctions || 0}</div>
                </div>
                
                {/* Active Auctions */}
                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                  <div className="text-sm font-medium text-gray-600 mb-1">Active Auctions</div>
                  <div className="text-2xl font-bold text-green-600">{sellerStats?.activeAuctions || 0}</div>
                </div>
                
                {/* Completed Auctions */}
                <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                  <div className="text-sm font-medium text-gray-600 mb-1">Completed Auctions</div>
                  <div className="text-2xl font-bold text-purple-600">{sellerStats?.completedAuctions || 0}</div>
                </div>
                
                {/* Average Rating */}
                {/* <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                  <div className="text-sm font-medium text-gray-600 mb-1">Average Rating</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {sellerStats?.avgRating ? `${sellerStats.avgRating}/5` : 'N/A'}
                  </div>
                </div> */}
                
                {/* Total Reviews */}
                {/* <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-500">
                  <div className="text-sm font-medium text-gray-600 mb-1">Total Reviews</div>
                  <div className="text-2xl font-bold text-gray-600">{sellerStats?.totalReviews || 0}</div>
                </div> */}
                
                {/* Additional Stats */}
                <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500">
                  <div className="text-sm font-medium text-gray-600 mb-1">Total Bids Received</div>
                  <div className="text-2xl font-bold text-indigo-600">{sellerStats?.totalBidsReceived || 0}</div>
                </div>
                
                {/* <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                  <div className="text-sm font-medium text-gray-600 mb-1">Success Rate</div>
                  <div className="text-2xl font-bold text-red-600">{sellerStats?.successRate || 0}%</div>
                </div> */}
                
                <div className="bg-teal-50 p-4 rounded-lg border-l-4 border-teal-500">
                  <div className="text-sm font-medium text-gray-600 mb-1">Avg Bid per Auction</div>
                  <div className="text-2xl font-bold text-teal-600">₹{(sellerStats?.avgBidPerAuction || 0)}</div>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                  <div className="text-sm font-medium text-gray-600 mb-1">Total Revenue</div>
                  <div className="text-2xl font-bold text-orange-600">₹{(sellerStats?.totalRevenue || 0).toLocaleString()}</div>
                </div>
                
                <div className="bg-pink-50 p-4 rounded-lg border-l-4 border-pink-500">
                  <div className="text-sm font-medium text-gray-600 mb-1">Profile Completion</div>
                  <div className="text-2xl font-bold text-pink-600">{sellerStats?.profileCompletion || 0}%</div>
                </div>
                
                <div className="bg-emerald-50 p-4 rounded-lg border-l-4 border-emerald-500">
                  <div className="text-sm font-medium text-gray-600 mb-1">Verification Status</div>
                  <div className="text-lg font-bold text-emerald-600">
                    {sellerStats?.verified ? 'Verified' : 'Pending'}
                  </div>
                </div>
                
                <div className="bg-violet-50 p-4 rounded-lg border-l-4 border-violet-500">
                  <div className="text-sm font-medium text-gray-600 mb-1">Member Since</div>
                  <div className="text-sm font-bold text-violet-600">
                    {sellerStats?.memberSince ? new Date(sellerStats.memberSince).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short' 
                    }) : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Performance Overview */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <FaCheck className="text-blue-500" />
                  Performance Overview
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">Total Revenue</span>
                      <span className="text-lg font-bold text-blue-600">₹{(sellerStats?.totalRevenue || 0).toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">Success Rate</span>
                      <span className="text-lg font-bold text-green-600">{sellerStats?.successRate || 0}%</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">Avg Bid per Auction</span>
                      <span className="text-lg font-bold text-purple-600">₹{sellerStats?.avgBidPerAuction || 0}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">Average Rating</span>
                      <span className="text-lg font-bold text-yellow-600">
                        {sellerStats?.avgRating ? `${sellerStats.avgRating}/5` : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">Total Reviews</span>
                      <span className="text-lg font-bold text-gray-600">{sellerStats?.totalReviews || 0}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">Profile Complete</span>
                      <span className="text-lg font-bold text-indigo-600">{sellerStats?.profileCompletion || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions & Account Info */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link to="/seller/create" className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                      Create New Auction
                    </Link>
                    <Link to="/seller/myauction" className="block w-full bg-green-600 text-white text-center py-3 px-4 rounded-lg hover:bg-green-700 transition-colors">
                      Manage Auctions
                    </Link>
                    <Link to="/seller/profile" className="block w-full bg-purple-600 text-white text-center py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                      Edit Profile
                    </Link>
                  </div>
                </div>
                
                {/* Account Status */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Verification</span>
                      <span className={`text-sm font-medium ${sellerStats.verified ? 'text-green-600' : 'text-amber-600'}`}>
                        {sellerStats.verified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Member Since</span>
                      <span className="text-sm font-medium text-gray-600">
                        {sellerStats.memberSince ? new Date(sellerStats.memberSince).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last Login</span>
                      <span className="text-sm font-medium text-gray-600">
                        {sellerStats.lastLogin ? new Date(sellerStats.lastLogin).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  {!sellerStats.verified && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800">
                        Complete your profile verification to build customer trust.
                      </p>
                    </div>
                  )}
                  
                  {sellerStats.profileCompletion < 100 && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Your profile is {sellerStats.profileCompletion}% complete. 
                        <Link to="/seller/profile" className="underline font-medium">Complete now</Link>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Basic Stats for Non-Seller View */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500">
                Total Auctions
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data?.totalAuctions || 0}
              </p>
            </div>
            <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500">
                Active Auctions
              </h3>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {data?.activeAuctions || 0}
              </p>
            </div>
            <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500">
                Your Auctions
              </h3>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {data?.userAuctionCount || 0}
              </p>
            </div>
          </div>
        )}

        {/* Recent Auctions Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isSellerView ? 'Your Recent Auctions' : 'Recent Auctions'}
            </h2>
            <Link
              to={isSellerView ? "/seller/myauction" : "/auction"}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline flex items-center gap-2"
            >
              <FaEye />
              View All
            </Link>
          </div>

          {(isSellerView ? sellerAuctions?.length === 0 : data.latestAuctions.length === 0) ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-lg border border-gray-200">
              <CiGift className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">
                {isSellerView ? 'You haven\'t created any auctions yet.' : 'No auctions available at the moment.'}
              </p>
              {isSellerView && (
                <Link to="/seller/create">
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Create Your First Auction
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 place-items-center gap-6">
              {(isSellerView ? sellerAuctions?.slice(0, 6) : data.latestAuctions).map((auction) => (
                <AuctionCard key={auction._id} auction={auction} />
              ))}
            </div>
          )}
        </div>

        {/* Show "Your Auctions" section only for non-seller view */}
        {!isSellerView && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Auctions</h2>
              <Link
                to="/myauction"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline flex items-center gap-2"
              >
                <FaEye />
                View All
              </Link>
            </div>

            {data.latestUserAuctions.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-lg border border-gray-200">
                <CiGift className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-4">
                  You haven't created any auctions yet.
                </p>
                <Link to="/create">
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Create Your First Auction
                  </button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 place-items-center gap-6">
                {data.latestUserAuctions.map((auction) => (
                  <AuctionCard key={auction._id} auction={auction} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
