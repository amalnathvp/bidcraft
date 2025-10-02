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
  
  // New state for modals
  const [showSellerProfile, setShowSellerProfile] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showOtherItems, setShowOtherItems] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: "",
    message: "",
    buyerName: "",
    buyerEmail: ""
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState("");
  const [contactError, setContactError] = useState("");
  
  const queryClient = useQueryClient();
  const { buyerUser, isAuthenticated } = useBuyerAuth();
  const { seller, isAuthenticated: isSellerAuthenticated } = useSellerAuth();
  
  // Check if this is being accessed from seller route
  const isSellerRoute = location.pathname.includes('/seller/');
  
  const { data: auction, isLoading, error } = useQuery({
    queryKey: ["auction", id],
    queryFn: () => {
      // Always use buyer API for better compatibility and public access
      if (isSellerRoute) {
        return viewAuction(id);
      } else {
        // For buyer routes, always use the buyer API endpoint
        return getBuyerAuctionDetails(id);
      }
    },
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Query for other items by the same seller
  const { data: sellerItems, isLoading: sellerItemsLoading } = useQuery({
    queryKey: ["sellerItems", auction?.seller?._id],
    queryFn: () => fetch(`/api/buyer/auction/seller/${auction?.seller?._id}`, {
      credentials: 'include'
    }).then(res => res.json()),
    enabled: !!auction?.seller?._id && showOtherItems
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
    auction: auction ? 'loaded' : 'not loaded',
    // Buyer auth debugging
    buyerAuthenticated: isAuthenticated,
    buyerUser: buyerUser ? 'loaded' : 'not loaded',
    buyerUserId: buyerUser?._id,
    buyerUserRole: buyerUser?.role,
    // Combined auth debugging
    anyAuthenticated: isAuthenticated || isSellerAuthenticated,
    currentUser: buyerUser || seller?.user ? 'loaded' : 'not loaded'
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

  // Handle contact form
  const handleContactFormChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactLoading(true);
    setContactError("");
    
    // Get current user for form data (but don't block submission)
    const currentUser = buyerUser || seller?.user;
    
    // Check if user is trying to contact themselves (only check if we have user data)
    if (currentUser && auction?.seller) {
      const currentUserId = currentUser._id || currentUser.id;
      const auctionSellerId = auction.seller._id || auction.seller;
      
      if (currentUserId === auctionSellerId) {
        setContactError("You cannot contact yourself.");
        setContactLoading(false);
        return;
      }
    }
    
    try {
      const response = await fetch('/api/notifications/contact-seller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          sellerId: auction.seller._id,
          auctionId: auction._id,
          subject: contactForm.subject,
          message: contactForm.message,
          buyerName: contactForm.buyerName || currentUser?.firstName || currentUser?.name || 'Anonymous',
          buyerEmail: contactForm.buyerEmail || currentUser?.email || ''
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setContactSuccess("Message sent successfully!");
        setContactForm({ subject: "", message: "", buyerName: "", buyerEmail: "" });
        setTimeout(() => {
          setShowContactForm(false);
          setContactSuccess("");
        }, 2000);
      } else {
        // Handle specific error responses
        if (response.status === 401) {
          setContactError("Please log in to contact the seller.");
        } else if (response.status === 403) {
          setContactError("You don't have permission to contact the seller.");
        } else {
          setContactError(data.message || "Failed to send message");
        }
      }
    } catch (error) {
      console.error('Contact seller error:', error);
      setContactError("Failed to send message. Please try again.");
    } finally {
      setContactLoading(false);
    }
  };

  // Initialize contact form with current user data
  React.useEffect(() => {
    const currentUser = buyerUser || seller?.user;
    if (currentUser && showContactForm) {
      setContactForm(prev => ({
        ...prev,
        buyerName: currentUser.firstName || currentUser.name || "",
        buyerEmail: currentUser.email || ""
      }));
    }
  }, [buyerUser, seller, showContactForm]);

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
                  <h4 className="font-semibold text-lg">
                    {auction.seller?.businessName || auction.seller?.name || "Unknown Seller"}
                  </h4>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-500">⭐</span>
                    <span className="font-medium">
                      {auction.seller?.averageRating ? 
                        `${auction.seller.averageRating} (${auction.seller.totalSales || 0} sales)` : 
                        "No ratings yet"
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={auction.seller?.verified ? "text-green-600" : "text-gray-400"}>
                      {auction.seller?.verified ? "✓" : "○"}
                    </span>
                    <span className={`font-medium ${auction.seller?.verified ? "text-green-600" : "text-gray-500"}`}>
                      {auction.seller?.verified ? "Verified" : "Unverified"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <span>📍</span>
                    <span className="text-gray-600">
                      {auction.seller?.city && auction.seller?.state ? 
                        `${auction.seller.city}, ${auction.seller.state}` :
                        auction.seller?.city || 
                        auction.seller?.country || 
                        "Location not specified"
                      }
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Member since {auction.seller?.signupAt ? 
                      new Date(auction.seller.signupAt).getFullYear() : 
                      "Unknown"
                    }
                  </p>
                  {auction.seller?.description && (
                    <p className="text-sm text-gray-600 mt-2 italic">
                      "{auction.seller.description}"
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <button 
                    onClick={() => setShowSellerProfile(true)}
                    className="block w-full bg-orange-100 text-orange-800 px-4 py-2 rounded-lg font-medium hover:bg-orange-200"
                  >
                    View Profile
                  </button>
                  <button 
                    onClick={() => setShowContactForm(true)}
                    className="block w-full bg-orange-100 text-orange-800 px-4 py-2 rounded-lg font-medium hover:bg-orange-200"
                  >
                    Contact Seller
                  </button>
                  <button 
                    onClick={() => setShowOtherItems(true)}
                    className="block w-full bg-orange-100 text-orange-800 px-4 py-2 rounded-lg font-medium hover:bg-orange-200"
                  >
                    Other Items
                  </button>
                </div>
              </div>
              
              {/* Additional Business Information */}
              {(auction.seller?.businessType || auction.seller?.website) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {auction.seller?.businessType && (
                    <div className="flex items-center gap-2 mb-2">
                      <span>🏢</span>
                      <span className="text-sm text-gray-600">
                        Business Type: {auction.seller.businessType}
                      </span>
                    </div>
                  )}
                  {auction.seller?.website && (
                    <div className="flex items-center gap-2 mb-2">
                      <span>🌐</span>
                      <a 
                        href={auction.seller.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              )}
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

        {/* Seller Profile Modal */}
        {showSellerProfile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Seller Profile</h2>
                <button 
                  onClick={() => setShowSellerProfile(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    {auction.seller?.avatar ? (
                      <img 
                        src={auction.seller.avatar} 
                        alt={auction.seller.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">👤</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {auction.seller?.businessName || auction.seller?.name || "Unknown Seller"}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={auction.seller?.verified ? "text-green-600" : "text-gray-400"}>
                        {auction.seller?.verified ? "✓" : "○"}
                      </span>
                      <span className={`text-sm ${auction.seller?.verified ? "text-green-600" : "text-gray-500"}`}>
                        {auction.seller?.verified ? "Verified Seller" : "Unverified"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-700">Contact Information</h4>
                    <p className="text-sm text-gray-600">Email: {auction.seller?.email || "Not provided"}</p>
                    {auction.seller?.phone && (
                      <p className="text-sm text-gray-600">Phone: {auction.seller.phone}</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-700">Location</h4>
                    <p className="text-sm text-gray-600">
                      {auction.seller?.city && auction.seller?.state ? 
                        `${auction.seller.city}, ${auction.seller.state}` :
                        auction.seller?.city || 
                        auction.seller?.country || 
                        "Location not specified"
                      }
                    </p>
                  </div>

                  {auction.seller?.businessType && (
                    <div>
                      <h4 className="font-semibold text-gray-700">Business Type</h4>
                      <p className="text-sm text-gray-600">{auction.seller.businessType}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold text-gray-700">Member Since</h4>
                    <p className="text-sm text-gray-600">
                      {auction.seller?.signupAt ? 
                        new Date(auction.seller.signupAt).getFullYear() : 
                        "Unknown"
                      }
                    </p>
                  </div>
                </div>

                {auction.seller?.description && (
                  <div>
                    <h4 className="font-semibold text-gray-700">About</h4>
                    <p className="text-sm text-gray-600">{auction.seller.description}</p>
                  </div>
                )}

                {auction.seller?.website && (
                  <div>
                    <h4 className="font-semibold text-gray-700">Website</h4>
                    <a 
                      href={auction.seller.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      {auction.seller.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contact Seller Modal */}
        {showContactForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Contact Seller</h2>
                <button 
                  onClick={() => setShowContactForm(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {contactSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                  {contactSuccess}
                </div>
              )}

              {contactError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {contactError}
                </div>
              )}

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    name="buyerName"
                    value={contactForm.buyerName}
                    onChange={handleContactFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Email</label>
                  <input
                    type="email"
                    name="buyerEmail"
                    value={contactForm.buyerEmail}
                    onChange={handleContactFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={contactForm.subject}
                    onChange={handleContactFormChange}
                    placeholder="e.g., Question about this auction"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    name="message"
                    value={contactForm.message}
                    onChange={handleContactFormChange}
                    rows={4}
                    placeholder="Enter your message here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={contactLoading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {contactLoading ? "Sending..." : "Send Message"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowContactForm(false)}
                    className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Other Items Modal */}
        {showOtherItems && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Other Items by {auction.seller?.businessName || auction.seller?.name}</h2>
                <button 
                  onClick={() => setShowOtherItems(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {sellerItemsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading seller's items...</p>
                </div>
              ) : sellerItems?.auctions?.total?.length > 0 ? (
                <div>
                  <div className="mb-4 text-sm text-gray-600">
                    {sellerItems.stats.totalAuctions} total items • {sellerItems.stats.activeAuctions} active • {sellerItems.stats.endedAuctions} ended
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sellerItems.auctions.total
                      .filter(item => item._id !== auction._id) // Exclude current auction
                      .map((item) => (
                      <div key={item._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <img 
                          src={item.itemPhotos?.[0] || "/api/placeholder/200/150"} 
                          alt={item.itemName}
                          className="w-full h-32 object-cover rounded mb-2"
                        />
                        <h3 className="font-semibold text-sm mb-1 line-clamp-2">{item.itemName}</h3>
                        <p className="text-blue-600 font-bold">${item.currentPrice || item.startingPrice}</p>
                        <p className="text-xs text-gray-500 mb-2">
                          {new Date(item.itemEndDate) > new Date() ? 
                            `Ends: ${new Date(item.itemEndDate).toLocaleDateString()}` :
                            "Auction Ended"
                          }
                        </p>
                        <button
                          onClick={() => {
                            setShowOtherItems(false);
                            navigate(isSellerRoute ? `/seller/auction/${item._id}` : `/auction/${item._id}`);
                          }}
                          className="w-full bg-blue-600 text-white py-1 px-2 rounded text-sm hover:bg-blue-700"
                        >
                          View Item
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  This seller has no other items listed.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};