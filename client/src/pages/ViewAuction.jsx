import React, { useRef, useState } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { placeBid, viewAuction, updateAuction, deleteAuction } from "../api/auction.js";
import { useSelector } from "react-redux";
import { useSellerAuth } from "../contexts/SellerAuthContext.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx";

export const ViewAuction = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { seller, isAuthenticated: isSellerAuthenticated, isLoading: sellerLoading } = useSellerAuth();
  const queryClient = useQueryClient();
  const inputRef = useRef();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Check if we're in seller context based on URL
  const isSellerView = location.pathname.startsWith('/seller');
  
  const { data, isLoading } = useQuery({
    queryKey: ["viewAuctions", id],
    queryFn: () => viewAuction(id),
    staleTime: 30 * 1000,
    placeholderData: () => undefined,
  });

  const placeBidMutate = useMutation({
    mutationFn: ({ bidAmount, id }) => placeBid({ bidAmount, id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viewAuctions"] });
      if (inputRef.current) inputRef.current.value = "";
    },
    onError: (error) => {
      console.log("Error: ", error.message);
    },
  });

  const updateAuctionMutate = useMutation({
    mutationFn: ({ id, data }) => updateAuction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viewAuctions"] });
      setIsEditing(false);
      alert("Auction updated successfully!");
    },
    onError: (error) => {
      alert(error.response?.data?.message || "Error updating auction");
    },
  });

  const deleteAuctionMutate = useMutation({
    mutationFn: (id) => deleteAuction(id),
    onSuccess: () => {
      alert("Auction deleted successfully!");
      navigate("/seller");
    },
    onError: (error) => {
      alert(error.response?.data?.message || "Error deleting auction");
    },
  });

  // Show loading while auction data or seller auth (in seller view) is loading
  if (isLoading || (isSellerView && sellerLoading)) return <LoadingScreen />;
  
  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Auction not found</h2>
          <p className="text-gray-500">The auction you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const handleBidSubmit = (e) => {
    e.preventDefault();
    let bidAmount = e.target.bidAmount.value.trim();
    placeBidMutate.mutate({ bidAmount, id });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updateData = {
      itemName: formData.get('itemName'),
      itemDescription: formData.get('itemDescription'),
      itemCategory: formData.get('itemCategory'),
      itemEndDate: formData.get('itemEndDate'),
    };
    updateAuctionMutate.mutate({ id, data: updateData });
  };

  const handleDeleteClick = () => {
    if (window.confirm('Are you sure you want to delete this auction? This action cannot be undone.')) {
      deleteAuctionMutate.mutate(id);
    }
  };

  const startEditing = () => {
    setEditForm({
      itemName: data.itemName,
      itemDescription: data.itemDescription,
      itemCategory: data.itemCategory,
      itemEndDate: data.itemEndDate?.split('T')[0], // Format for date input
    });
    setIsEditing(true);
  };

  const daysLeft = Math.ceil(
    Math.max(0, new Date(data.itemEndDate) - new Date()) / (1000 * 60 * 60 * 24)
  );
  const isActive = Math.max(0, new Date(data.itemEndDate) - new Date()) > 0;

  // Check if current user is the seller owner
  const isOwner = React.useMemo(() => {
    if (!isSellerView || !data) return false;
    
    // Wait for seller authentication to complete
    if (!seller?.user?._id) {
      console.log('ViewAuction: Seller not loaded yet');
      return false;
    }
    
    const sellerId = seller.user._id;
    const auctionSellerId = data.seller?._id || data.seller; // Handle both populated and ObjectId formats
    
    // Try both strict and string comparison for robustness
    const isMatch = sellerId === auctionSellerId || String(sellerId) === String(auctionSellerId);
    
    console.log('ViewAuction Ownership check:', {
      isSellerView,
      sellerId,
      auctionSellerId,
      sellerIdType: typeof sellerId,
      auctionSellerIdType: typeof auctionSellerId,
      strictMatch: sellerId === auctionSellerId,
      stringMatch: String(sellerId) === String(auctionSellerId),
      finalMatch: isMatch,
      sellerObject: seller,
      dataSellerObject: data.seller
    });
    
    return isMatch;
  }, [isSellerView, seller, data]);
  
  // Only buyers can bid (sellers cannot bid at all)
  const canBid = !isSellerView && user && data.seller._id !== user.user._id && isActive;

  return (
    <div className="min-h-screen bg-gray-50  mx-auto container">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4 grid grid-cols-1 place-items-center content-start">
            <div className="max-w-xl aspect-square bg-white rounded-md shadow-md border border-gray-200 overflow-hidden flex items-center justify-center">
              <img
                src={data.itemPhotos && data.itemPhotos.length > 0 ? data.itemPhotos[0] : data.itemPhoto || "https://picsum.photos/601"}
                alt={data.itemName}
                className="h-full w-full object-fill"
              />
            </div>
            {/* Additional Images */}
            {data.itemPhotos && data.itemPhotos.length > 1 && (
              <div className="grid grid-cols-4 gap-2 max-w-xl">
                {data.itemPhotos.slice(1, 5).map((photo, index) => (
                  <div key={index} className="aspect-square bg-white rounded border border-gray-200 overflow-hidden">
                    <img
                      src={photo}
                      alt={`${data.itemName} view ${index + 2}`}
                      className="h-full w-full object-cover cursor-pointer hover:opacity-80"
                    />
                  </div>
                ))}
                {data.itemPhotos.length > 5 && (
                  <div className="aspect-square bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                    <span className="text-gray-600 text-sm">+{data.itemPhotos.length - 5}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-xs font-medium">
                  {data.itemCategory}
                </span>
                <span
                  className={`px-2 py-1 rounded-md text-xs font-medium ${
                    isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {isActive ? "Active" : "Ended"}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {data.itemName}
              </h1>
              <p className="text-gray-600 leading-relaxed">
                {data.itemDescription}
              </p>
            </div>

            {/* Pricing Info */}
            <div className="bg-white p-6 rounded-md shadow-md border border-gray-200">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Starting Price</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ₹{data.startingPrice}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Price</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{data.currentPrice}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Bids</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {data.bidCount || data.bids?.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time Left</p>
                  <p
                    className={`text-lg font-semibold ${
                      isActive ? "text-red-600" : "text-gray-500"
                    }`}
                  >
                    {isActive ? `${daysLeft} days` : "Ended"}
                  </p>
                </div>
              </div>
            </div>

            {/* Bid Form for Buyers and Non-Owner Sellers */}
            {canBid && (
              <div className="bg-white p-6 rounded-md shadow-md border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Place Your Bid</h3>
                <form onSubmit={handleBidSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="bidAmount"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Bid Amount (minimum: ₹{data.currentPrice + 1} maximum: ₹
                      {data.currentPrice + 10})
                    </label>
                    <input
                      type="number"
                      name="bidAmount"
                      id="bidAmount"
                      ref={inputRef}
                      min={data.currentPrice + 1}
                      max={data.currentPrice + 10}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your bid amount"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Place Bid
                  </button>
                </form>
              </div>
            )}

            {/* Message when can't bid - but don't show for auction owners */}
            {!canBid && !isOwner && isSellerView && seller?.user?._id && (
              <div className="bg-white p-6 rounded-md shadow-md border border-gray-200">
                <div className="text-center text-gray-500">
                  <div>
                    <p className="text-orange-600 font-medium mb-2">Seller View Mode</p>
                    <p>Sellers cannot place bids. Only buyers can bid on auctions.</p>
                    <p className="text-sm text-gray-400 mt-2">To bid on this auction, please log in as a buyer.</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Loading state for seller authentication */}
            {isSellerView && !seller?.user?._id && (
              <div className="bg-white p-6 rounded-md shadow-md border border-gray-200">
                <div className="text-center text-gray-500">
                  <div className="animate-pulse">
                    <p>Loading seller information...</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Show message for non-seller views when can't bid */}
            {!canBid && !isSellerView && (
              <div className="bg-white p-6 rounded-md shadow-md border border-gray-200">
                <div className="text-center text-gray-500">
                  {!isActive ? (
                    <p>This auction has ended.</p>
                  ) : (
                    <p>Please log in as a buyer to place a bid.</p>
                  )}
                </div>
              </div>
            )}

            {/* Seller Actions - Edit/Delete */}
            {isOwner && (
              <div className="bg-green-50 p-6 rounded-md shadow-md border border-green-200">
                <div className="flex items-center justify-center mb-4">
                  <div className="text-green-700 text-center">
                    <div className="text-2xl mb-2">✅</div>
                    <p className="font-semibold text-lg">You own this auction</p>
                    <p className="text-sm text-green-600">Auction ID: {data._id}</p>
                    <p className="text-xs text-green-500 mt-1">Seller ID: {seller?.user?._id}</p>
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-4 text-center">Auction Management</h3>
                {!isEditing ? (
                  <div className="space-y-3">
                    <button
                      onClick={startEditing}
                      disabled={data.bids.length > 0}
                      className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                        data.bids.length > 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {data.bids.length > 0 ? 'Cannot Edit (Has Bids)' : 'Edit Auction'}
                    </button>
                    <button
                      onClick={handleDeleteClick}
                      disabled={data.bids.length > 0}
                      className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                        data.bids.length > 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {data.bids.length > 0 ? 'Cannot Delete (Has Bids)' : 'Delete Auction'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Item Name
                      </label>
                      <input
                        type="text"
                        name="itemName"
                        defaultValue={editForm.itemName}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        name="itemDescription"
                        defaultValue={editForm.itemDescription}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        name="itemCategory"
                        defaultValue={editForm.itemCategory}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        name="itemEndDate"
                        defaultValue={editForm.itemEndDate}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors font-medium"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Seller Info */}
            <div className="bg-white p-6 rounded-md shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold mb-3">Seller Information</h3>
              <p className="text-gray-900 font-medium">{data.seller.name}</p>
            </div>
          </div>
        </div>

        {/* Bid History */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {isSellerView ? 'Bidders List' : 'Bid History'}
          </h2>
          <div className="bg-white rounded-md shadow-md border border-gray-200 overflow-hidden">
            {data.bids.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {isSellerView ? 'No bids received yet.' : 'No bids yet. Be the first to bid!'}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {isSellerView && (
                  <div className="bg-gray-50 px-4 py-3 grid grid-cols-4 gap-4 text-sm font-medium text-gray-700">
                    <div>Bidder Name</div>
                    <div>Bid Amount</div>
                    <div>Date</div>
                    <div>Time</div>
                  </div>
                )}
                {data.bids.map((bid, index) => (
                  <div
                    key={index}
                    className={`p-4 ${
                      isSellerView 
                        ? 'grid grid-cols-4 gap-4 items-center'
                        : 'flex justify-between items-center'
                    }`}
                  >
                    {isSellerView ? (
                      <>
                        <div>
                          <p className="font-medium text-gray-900">
                            {bid.bidder?.name || 'Anonymous'}
                          </p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-green-600">
                            ₹{bid.bidAmount}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            {new Date(bid.bidTime).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            {new Date(bid.bidTime).toLocaleTimeString()}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="font-medium text-gray-900">
                            {bid.bidder?.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(bid.bidTime).toLocaleDateString()} at{" "}
                            {new Date(bid.bidTime).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-green-600">
                            ₹{bid.bidAmount}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
