import React, { useState } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBuyerAuctionDetails, placeBid } from "../../api/buyerAuction.js";
import { viewAuction, updateAuction, deleteAuction } from "../../api/auction.js";
import { useSellerAuth } from "../../contexts/SellerAuthContext.jsx";
import { BuyerNavbar } from "./BuyerNavbar.jsx";
import { useBuyerAuth } from "../../contexts/BuyerAuthContext.jsx";

const ImageGallery = ({ images, itemName }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  
  // Create array of images, using placeholder if no images
  const imageList = images && images.length > 0 ? images : ["/api/placeholder/600/600"];
  
  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden">
        <img 
          src={imageList[selectedImage]} 
          alt={itemName}
          className="w-full h-96 object-cover"
        />
        <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
          {selectedImage + 1}/{imageList.length}
        </div>
      </div>
      
      {/* Thumbnail Navigation */}
      <div className="grid grid-cols-4 gap-2">
        {imageList.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(index)}
            className={`relative rounded-lg overflow-hidden border-2 transition-colors ${
              selectedImage === index ? 'border-blue-500' : 'border-gray-200'
            }`}
          >
            <img 
              src={image} 
              alt={`${itemName} view ${index + 1}`}
              className="w-full h-20 object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

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

export const AuctionDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [bidAmount, setBidAmount] = useState("");
  const [bidError, setBidError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const queryClient = useQueryClient();
  const { buyerUser, isAuthenticated } = useBuyerAuth();
  const { seller, isAuthenticated: isSellerAuthenticated } = useSellerAuth();
  
  // Check if this is being accessed from seller route
  const isSellerRoute = location.pathname.includes('/seller/');
  
  const { data: auction, isLoading, error } = useQuery({
    queryKey: ["auction", id],
    queryFn: () => isSellerRoute ? viewAuction(id) : getBuyerAuctionDetails(id),
  });

  // Check if current seller is the owner of this auction (after data loads)
  const isOwner = React.useMemo(() => {
    if (!isSellerRoute || !isSellerAuthenticated || !seller || !auction) return false;
    
    const sellerId = seller?.user?._id;
    const auctionSellerId = auction?.seller?._id || auction?.seller;
    
    console.log('Ownership check:', {
      isSellerRoute,
      isSellerAuthenticated,
      sellerId,
      auctionSellerId,
      match: sellerId === auctionSellerId,
      sellerObject: seller,
      auctionObject: auction?.seller
    });
    
    return sellerId === auctionSellerId;
  }, [isSellerRoute, isSellerAuthenticated, seller, auction]);
  
  // Debug logging
  console.log('AuctionDetail Debug:', {
    isSellerRoute,
    isSellerAuthenticated,
    sellerId: seller?.user?._id,
    auctionSellerId: auction?.seller?._id || auction?.seller,
    isOwner,
    auction: auction ? 'loaded' : 'not loaded'
  });

  const bidMutation = useMutation({
    mutationFn: ({ bidAmount, id }) => placeBid({ bidAmount, id }),
    onSuccess: () => {
      setBidAmount("");
      setBidError("");
      queryClient.invalidateQueries({ queryKey: ["auction", id] });
    },
    onError: (error) => {
      setBidError(error.message || "Failed to place bid");
    }
  });

  const updateAuctionMutate = useMutation({
    mutationFn: ({ id, data }) => updateAuction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auction", id] });
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

  const handlePlaceBid = () => {
    const amount = parseFloat(bidAmount);
    const currentPrice = auction.currentPrice > 0 ? auction.currentPrice : auction.startingPrice;
    
    if (!amount || amount <= 0) {
      setBidError("Please enter a valid bid amount");
      return;
    }
    
    if (amount <= currentPrice) {
      setBidError(`Bid must be higher than current price of $${currentPrice}`);
      return;
    }
    
    setBidError("");
    bidMutation.mutate({ bidAmount: amount, id });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    
    // Add text fields
    formData.append('itemName', e.target.itemName.value);
    formData.append('itemDescription', e.target.itemDescription.value);
    formData.append('itemCategory', e.target.itemCategory.value);
    formData.append('itemEndDate', e.target.itemEndDate.value);
    
    // Add existing images that weren't removed
    existingImages.forEach((image, index) => {
      formData.append('existingImages', image);
    });
    
    // Add new images
    selectedImages.forEach((image, index) => {
      formData.append('itemPhotos', image);
    });
    
    updateAuctionMutate.mutate({ id, data: formData });
  };

  const handleDeleteClick = () => {
    if (window.confirm('Are you sure you want to delete this auction? This action cannot be undone.')) {
      deleteAuctionMutate.mutate(id);
    }
  };

  const startEditing = () => {
    setEditForm({
      itemName: auction.itemName,
      itemDescription: auction.itemDescription,
      itemCategory: auction.itemCategory,
      itemEndDate: auction.itemEndDate?.split('T')[0], // Format for date input
    });
    setExistingImages(auction.itemPhotos || []);
    setSelectedImages([]);
    setImagePreviews([]);
    setIsEditing(true);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(prev => [...prev, ...files]);
    
    // Create previews for new images
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeSelectedImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {!isSellerRoute && <BuyerNavbar />}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-300 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-32 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="min-h-screen bg-gray-50">
        {!isSellerRoute && <BuyerNavbar />}
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Auction Not Found</h2>
          <p className="text-gray-600 mb-6">The auction you're looking for doesn't exist or has been removed.</p>
          <Link to={isSellerRoute ? "/seller/live-auctions" : "/live-auctions"} className="bg-blue-600 text-white px-6 py-3 rounded-lg">
            Browse Other Auctions
          </Link>
        </div>
      </div>
    );
  }

  // Prepare images array
  const auctionImages = auction.itemPhotos && auction.itemPhotos.length > 0 ? auction.itemPhotos : ["/api/placeholder/600/600"];

  return (
    <div className="min-h-screen bg-gray-50">
      {!isSellerRoute && <BuyerNavbar />}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - Images */}
          <div>
            <ImageGallery images={auctionImages} itemName={auction.itemName} />
          </div>

          {/* Right Column - Auction Details */}
          <div className="space-y-6">
            {/* Current Bid Info */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-600">Current Bid:</p>
                  <p className="text-4xl font-bold text-gray-900">${auction.currentPrice > 0 ? auction.currentPrice : auction.startingPrice}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{auction.bids?.length || 0} bids</p>
                  <p className="text-sm text-green-600 font-medium">Reserve Met</p>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{auction.itemName}</h1>
              
              {/* Condition and Category */}
              <div className="flex gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Condition:</p>
                  <p className="font-medium">Excellent</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Category:</p>
                  <p className="font-medium">{auction.itemCategory}</p>
                </div>
              </div>

              {/* Authentication Badge */}
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mb-6">
                <span>🍀</span>
                <span className="font-medium">Certified Authentic</span>
              </div>

              {/* Bidding Section */}
              <div className="space-y-4">
                {isOwner ? (
                  <div className="bg-white p-6 rounded-md shadow-md border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Auction Management</h3>
                    {!isEditing ? (
                      <div className="space-y-3">
                        <button
                          onClick={startEditing}
                          disabled={auction.bids && auction.bids.length > 0}
                          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                            auction.bids && auction.bids.length > 0
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {auction.bids && auction.bids.length > 0 ? 'Cannot Edit (Has Bids)' : 'Edit Auction'}
                        </button>
                        <button
                          onClick={handleDeleteClick}
                          disabled={auction.bids && auction.bids.length > 0}
                          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                            auction.bids && auction.bids.length > 0
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          {auction.bids && auction.bids.length > 0 ? 'Cannot Delete (Has Bids)' : 'Delete Auction'}
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Item Name
                          </label>
                          <input
                            type="text"
                            name="itemName"
                            defaultValue={editForm.itemName}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <textarea
                            name="itemDescription"
                            defaultValue={editForm.itemDescription}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category
                          </label>
                          <select
                            name="itemCategory"
                            defaultValue={editForm.itemCategory}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="Electronics">Electronics</option>
                            <option value="Clothing">Clothing</option>
                            <option value="Home & Garden">Home & Garden</option>
                            <option value="Sports">Sports</option>
                            <option value="Books">Books</option>
                            <option value="Art">Art</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Date
                          </label>
                          <input
                            type="date"
                            name="itemEndDate"
                            defaultValue={editForm.itemEndDate}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        
                        {/* Image Upload Section */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Images
                          </label>
                          
                          {/* Existing Images */}
                          {existingImages.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-600 mb-2">Current Images:</p>
                              <div className="grid grid-cols-3 gap-2">
                                {existingImages.map((image, index) => (
                                  <div key={`existing-${index}`} className="relative">
                                    <img
                                      src={image}
                                      alt={`Existing ${index + 1}`}
                                      className="w-full h-24 object-cover rounded border"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeExistingImage(index)}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* New Image Previews */}
                          {imagePreviews.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-600 mb-2">New Images:</p>
                              <div className="grid grid-cols-3 gap-2">
                                {imagePreviews.map((preview, index) => (
                                  <div key={`preview-${index}`} className="relative">
                                    <img
                                      src={preview}
                                      alt={`Preview ${index + 1}`}
                                      className="w-full h-24 object-cover rounded border"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeSelectedImage(index)}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* File Input */}
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            You can select multiple images. Current total: {existingImages.length + selectedImages.length} images
                          </p>
                        </div>
                        
                        <div className="flex space-x-3">
                          <button
                            type="submit"
                            disabled={updateAuctionMutate.isPending}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                          >
                            {updateAuctionMutate.isPending ? 'Updating...' : 'Update Auction'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : isSellerRoute ? (
                  <div className="text-center py-8 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-center mb-4">
                      <span className="text-2xl">�</span>
                    </div>
                    <p className="text-orange-800 font-medium mb-2">Seller View Mode</p>
                    <p className="text-orange-600 text-sm">Sellers cannot place bids. Only buyers can bid on auctions.</p>
                    <p className="text-orange-600 text-sm mt-2">To bid on this auction, please log in as a buyer.</p>
                  </div>
                ) : isAuthenticated ? (
                  <>
                    <div className="flex gap-3">
                      <button 
                        onClick={handlePlaceBid}
                        disabled={bidMutation.isPending}
                        className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <span>⚡</span>
                        {bidMutation.isPending ? "Placing Bid..." : "Place Bid"}
                      </button>
                      <button className="bg-gray-800 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-900 flex items-center gap-2">
                        <span>🛒</span>
                        Buy Now - ${(auction.currentPrice > 0 ? auction.currentPrice : auction.startingPrice) + 100}
                      </button>
                    </div>

                    <button className="w-full border-2 border-orange-600 text-orange-600 py-3 px-6 rounded-lg font-semibold hover:bg-orange-50">
                      Watch Item
                    </button>

                    {/* Bid Input */}
                    <div className="mt-4">
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={`Minimum bid: $${(auction.currentPrice > 0 ? auction.currentPrice : auction.startingPrice) + 1}`}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {bidError && (
                        <p className="text-red-600 text-sm mt-1">{bidError}</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-4">Please log in to place bids</p>
                    <Link 
                      to="/buyer/login" 
                      className="bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-700"
                    >
                      Login to Bid
                    </Link>
                  </div>
                )}
              </div>

              {/* Auction Details */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-600">Starting Bid:</p>
                  <p className="font-semibold">${auction.startingPrice}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Reserve Price:</p>
                  <p className="font-semibold">${auction.startingPrice + 100}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Shipping:</p>
                  <p className="font-semibold">$15 (3-5 business days)</p>
                </div>
              </div>
            </div>

            {/* Seller Information */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Seller Information</h3>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-lg">KashmirCrafts</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-500">⭐</span>
                    <span className="font-medium">4.9 (156 sales)</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600">✓</span>
                    <span className="text-green-600 font-medium">Verified</span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <span>📍</span>
                    <span className="text-gray-600">Srinagar, Kashmir</span>
                  </div>
                  <p className="text-sm text-gray-600">Member since 2019</p>
                </div>
                <div className="space-y-2">
                  <button className="block w-full bg-orange-100 text-orange-800 px-4 py-2 rounded-lg font-medium hover:bg-orange-200">
                    View Profile
                  </button>
                  <button className="block w-full bg-orange-100 text-orange-800 px-4 py-2 rounded-lg font-medium hover:bg-orange-200">
                    Contact Seller
                  </button>
                  <button className="block w-full bg-orange-100 text-orange-800 px-4 py-2 rounded-lg font-medium hover:bg-orange-200">
                    Other Items
                  </button>
                </div>
              </div>
            </div>

            {/* Item Description */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Item Description</h3>
              <p className="text-gray-700 leading-relaxed">{auction.itemDescription}</p>
              
              {/* Time Left */}
              <div className="mt-6 p-4 bg-red-50 rounded-lg">
                <p className="text-red-800 font-semibold">⏰ {formatTimeLeft(auction.itemEndDate)}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};