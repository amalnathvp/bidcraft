import { FaClock, FaArrowRight, FaChevronRight } from "react-icons/fa";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getBuyerAuctions } from "../../api/buyerAuction.js";
// import { AdsComponent } from "../AdsComponent";

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

const AuctionCard = ({ auction }) => {
  // Get the first image or use placeholder
  const displayImage = auction.itemPhotos && auction.itemPhotos.length > 0 
    ? auction.itemPhotos[0] 
    : auction.itemPhoto || "https://picsum.photos/400/300";
  
  const imageCount = auction.itemPhotos ? auction.itemPhotos.length : (auction.itemPhoto ? 1 : 0);
  
  return (
    <div className="border border-gray-200 rounded-md overflow-hidden hover:shadow-lg transition-shadow bg-white">
      <div className="relative">
        <img
          src={displayImage}
          alt={auction.itemName}
          className="w-full h-48 object-contain"
        />
        {imageCount > 1 && (
          <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded-sm text-xs">
            +{imageCount - 1} more
          </div>
        )}
        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-sm text-xs font-medium">
          <FaClock className="inline h-3 w-3 mr-1" />
          {formatTimeLeft(auction.itemEndDate)}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {auction.itemName}
        </h3>
        <p className="text-gray-600 text-xs mb-2">
          by {auction.sellerName || auction.seller?.name || 'Unknown Seller'}
        </p>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-500">Current Bid</p>
            <p className="text-lg font-bold text-gray-900">₹{auction.currentPrice}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Bids</p>
            <p className="text-sm font-medium text-gray-700">{auction.bidCount || 0}</p>
          </div>
        </div>
        <Link to='/signup'>
          <div className="w-full bg-indigo-900 hover:bg-indigo-800 text-white text-center py-2 px-4 rounded-sm font-medium transition-colors">
            Place Bid
          </div>
        </Link>
      </div>
    </div>
  );
};

export const Auction = () => {
  // Fetch live auctions data
  const { data: auctions, isLoading, error } = useQuery({
    queryKey: ["landingPageAuctions"],
    queryFn: getBuyerAuctions,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  // Show only first 6 auctions for landing page
  const displayAuctions = auctions?.slice(0, 6) || [];

  if (isLoading) {
    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Live Auctions</h2>
            <Link
              to="/live-auctions"
              className="text-gray-700 hover:text-gray-900 flex items-center"
            >
              View all <FaChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          {/* Loading skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-md overflow-hidden bg-white animate-pulse">
                <div className="w-full h-48 bg-gray-300"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded mb-4 w-2/3"></div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="h-6 bg-gray-300 rounded w-20"></div>
                    <div className="h-4 bg-gray-300 rounded w-12"></div>
                  </div>
                  <div className="h-8 bg-gray-300 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    console.error('Error loading auctions for landing page:', error);
  }

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Live Auctions</h2>
          <Link
            to="/live-auctions"
            className="text-gray-700 hover:text-gray-900 flex items-center"
          >
            View all <FaChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {displayAuctions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-2">
            {displayAuctions.map((auction) => (
              <AuctionCard key={auction._id} auction={auction} />
            ))}
          </div>
        ) : (
          // Fallback to show some example auctions if no real data
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-2">
            {/* Auction Item 1 - Fallback */}
            <div className="border border-gray-200 rounded-md overflow-hidden hover:shadow-lg transition-shadow bg-white">
              <div className="relative">
                <img
                  src="https://res.cloudinary.com/dhv8qx1qy/image/upload/v1750644725/miekytfqgwnlj4jqai5k.png"
                  alt="Vintage Camera"
                  className="w-full h-48 object-contain"
                />
                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-sm text-xs font-medium">
                  <FaClock className="inline h-3 w-3 mr-1" />
                  2h 15m
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  Vintage Film Camera - Excellent Condition
                </h3>
                <p className="text-gray-600 text-xs mb-2">by Example Seller</p>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-500">Current Bid</p>
                    <p className="text-lg font-bold text-gray-900">₹245.00</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Bids</p>
                    <p className="text-sm font-medium text-gray-700">12</p>
                  </div>
                </div>
                <Link to='/signup'>
                  <div className="w-full bg-indigo-900 hover:bg-indigo-800 text-white text-center py-2 px-4 rounded-sm font-medium transition-colors">
                    Place Bid
                  </div>
                </Link>
              </div>
            </div>

            {/* Auction Item 2 - Fallback */}
            <div className="border border-gray-200 rounded-md overflow-hidden hover:shadow-lg transition-shadow bg-white">
              <div className="relative">
                <img
                  src="https://res.cloudinary.com/dhv8qx1qy/image/upload/v1750644637/lk7l3ar3sptniptieyo3.png"
                  alt="Antique Watch"
                  className="w-full h-48 object-contain"
                />
                <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-sm text-xs font-medium">
                  <FaClock className="inline h-3 w-3 mr-1" />
                  5h 42m
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  Luxury Swiss Watch - Gold Plated
                </h3>
                <p className="text-gray-600 text-xs mb-2">by Watch Collector</p>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-500">Current Bid</p>
                    <p className="text-lg font-bold text-gray-900">₹1,250.00</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Bids</p>
                    <p className="text-sm font-medium text-gray-700">28</p>
                  </div>
                </div>
                <Link to='/signup'>
                  <div className="w-full bg-indigo-900 hover:bg-indigo-800 text-white text-center py-2 px-4 rounded-sm font-medium transition-colors">
                    Place Bid
                  </div>
                </Link>
              </div>
            </div>

            {/* Auction Item 3 - Fallback */}
            <div className="border border-gray-200 rounded-md overflow-hidden hover:shadow-lg transition-shadow bg-white">
              <div className="relative">
                <img
                  src="https://res.cloudinary.com/dhv8qx1qy/image/upload/v1750644675/tatznfsoekfp3vsoeswd.png"
                  alt="Art Painting"
                  className="w-full h-48 object-contain"
                />
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-sm text-xs font-medium">
                  <FaClock className="inline h-3 w-3 mr-1" />
                  1d 3h
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  Original Oil Painting - Abstract Art
                </h3>
                <p className="text-gray-600 text-xs mb-2">by Art Studio</p>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-500">Current Bid</p>
                    <p className="text-lg font-bold text-gray-900">₹890.00</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Bids</p>
                    <p className="text-sm font-medium text-gray-700">7</p>
                  </div>
                </div>
                <Link to='/signup'>
                  <div className="w-full bg-indigo-900 hover:bg-indigo-800 text-white text-center py-2 px-4 rounded-sm font-medium transition-colors">
                    Place Bid
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
        
        {/* Show count and link to view all */}
        {auctions && auctions.length > 6 && (
          <div className="text-center mt-8">
            <p className="text-gray-600 mb-4">
              Showing 6 of {auctions.length} active auctions
            </p>
            <Link
              to="/live-auctions"
              className="inline-flex items-center px-6 py-3 bg-indigo-900 text-white font-medium rounded-lg hover:bg-indigo-800 transition-colors"
            >
              View All {auctions.length} Auctions <FaArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        )}
        
        {/* Show view all even when showing less than 6 auctions */}
        {auctions && auctions.length > 0 && auctions.length <= 6 && (
          <div className="text-center mt-8">
            <Link
              to="/live-auctions"
              className="inline-flex items-center px-6 py-3 bg-indigo-900 text-white font-medium rounded-lg hover:bg-indigo-800 transition-colors"
            >
              View All Live Auctions <FaArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        )}
        
        {/* <AdsComponent dataAdSlot="5537585913" /> */}
      </div>
    </section>
  );
};
