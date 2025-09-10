import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { getCategoryName } from '../utils/categoryUtils';

interface AuctionDetailProps {
  auctionId: string;
  onNavigate?: (page: string) => void;
  onBack?: () => void;
}

// MongoDB Auction interface to match backend data structure
interface MongoAuction {
  _id: string;
  title: string;
  description: string;
  category: {
    _id: string;
    name: string;
    slug?: string;
  };
  subcategory?: string;
  images: Array<{
    url: string;
    publicId: string;
    alt?: string;
  }>;
  currentPrice: number;
  startingPrice: number;
  reservePrice: number;
  buyNowPrice?: number;
  totalBids: number;
  timeLeft?: string;
  endTime: string;
  startTime: string;
  seller: {
    _id: string;
    name?: string;
    shopName?: string;
    rating?: number;
    totalSales?: number;
    location?: string;
    memberSince?: string;
    verified?: boolean;
  };
  condition: string;
  status: string;
  watchers?: string[];
  materials?: string[];
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
    unit?: string;
  };
  origin?: {
    country?: string;
    region?: string;
    artisan?: string;
  };
  shipping?: {
    cost?: number;
    method?: string;
    freeShipping?: boolean;
    international?: boolean;
    handlingTime?: number;
  };
  authentication?: string;
  era?: string;
  specifications?: Array<{
    label: string;
    value: string;
  }>;
}

const AuctionDetail: React.FC<AuctionDetailProps> = ({ auctionId, onNavigate, onBack }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [bidAmount, setBidAmount] = useState('');
  const [watchlisted, setWatchlisted] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [auctionData, setAuctionData] = useState<MongoAuction | null>(null);
  const [loading, setLoading] = useState(true);
  // Removed unused error state

  const fetchAuctionData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 AuctionDetail: Fetching auction data for ID:', auctionId);
      
      const response = await apiService.get(`/auctions/${auctionId}`);
      
      if (response.success) {
        console.log('✅ AuctionDetail: Auction data fetched successfully');
        console.log('📊 AuctionDetail: Auction data:', response.data);
        setAuctionData(response.data);
      } else {
        console.error('❌ AuctionDetail: API response not successful:', response);
        setAuctionData(null);
      }
    } catch (error) {
      console.error('💥 AuctionDetail: Error fetching auction:', error);
      setAuctionData(null);
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  // Fetch auction data from MongoDB API
  useEffect(() => {
    fetchAuctionData();
  }, [fetchAuctionData]);

  // Convert MongoDB auction data to component-compatible format
  const auction = auctionData ? {
    id: auctionData._id,
    title: auctionData.title,
    description: auctionData.description,
    images: auctionData.images.map(img => img.url),
    currentBid: auctionData.currentPrice,
    startingBid: auctionData.startingPrice,
    reservePrice: auctionData.reservePrice,
    buyNowPrice: auctionData.buyNowPrice,
    bidCount: auctionData.totalBids,
    timeLeft: auctionData.timeLeft || "Calculating...",
    endDate: auctionData.endTime,
    seller: {
      name: auctionData.seller.shopName || auctionData.seller.name || "Unknown Seller",
      rating: auctionData.seller.rating || 0,
      totalSales: auctionData.seller.totalSales || 0,
      location: auctionData.seller.location || "Not specified",
      memberSince: auctionData.seller.memberSince || "Unknown",
      verified: auctionData.seller.verified || false
    },
    category: auctionData.category.name,
    subcategory: auctionData.subcategory || "",
    condition: auctionData.condition,
    era: auctionData.era || "Not specified",
    material: auctionData.materials?.[0] || "Not specified",
    dimensions: auctionData.dimensions ? 
      `${auctionData.dimensions.length || 0}cm x ${auctionData.dimensions.width || 0}cm` : 
      "Not specified",
    weight: auctionData.dimensions?.weight ? `${auctionData.dimensions.weight}g` : "Not specified",
    origin: auctionData.origin ? 
      `${auctionData.origin.region || ''}, ${auctionData.origin.country || ''}`.trim().replace(/^,\s*/, '') : 
      "Not specified",
    authentication: auctionData.authentication || "",
    shipping: {
      cost: auctionData.shipping?.cost || 0,
      time: auctionData.shipping?.handlingTime ? `${auctionData.shipping.handlingTime} days` : "Not specified",
      international: auctionData.shipping?.international || false,
      insurance: true // Default for now
    },
    bidHistory: [
      // Mock bid history for now - would need to fetch from separate API endpoint
      { bidder: "TopBidder", amount: auctionData.currentPrice, time: "Latest", current: true }
    ],
    specifications: auctionData.specifications || [
      { label: "Material", value: auctionData.materials?.[0] || "Not specified" },
      { label: "Condition", value: auctionData.condition },
      { label: "Category", value: getCategoryName(auctionData.category) }
    ],
    relatedItems: [
      // Mock related items for now - would need to fetch from separate API endpoint
      {
        id: "related-1",
        title: "Similar Item",
        currentBid: Math.floor(auctionData.currentPrice * 0.8),
        image: auctionData.images[0]?.url || "",
        timeLeft: "3d 12h"
      }
    ]
  } : null;

  // Show loading state if data is not yet loaded
  if (loading) {
    return (
      <div className="auction-detail loading">
        <div className="loading-spinner">Loading auction details...</div>
      </div>
    );
  }

  // Show error state if auction not found
  if (!auction) {
    return (
      <div className="auction-detail error">
        <div className="error-message">Auction not found or failed to load.</div>
      </div>
    );
  }

  const handleBidSubmit = () => {
    if (!auction) return;
    
    const bid = parseFloat(bidAmount);
    if (bid <= auction.currentBid) {
      alert('Bid must be higher than current bid');
      return;
    }
    // In real app, submit bid to API
    alert(`Bid of $${bid} placed successfully!`);
    setShowBidModal(false);
    setBidAmount('');
  };

  const handleWatchlist = () => {
    setWatchlisted(!watchlisted);
    // In real app, update watchlist via API
  };

  const formatTimeLeft = (timeString: string) => {
    return timeString.split(' ').map((part, index) => (
      <span key={index} className={`time-part ${part.includes('d') ? 'days' : part.includes('h') ? 'hours' : 'minutes'}`}>
        {part}
      </span>
    ));
  };

  return (
    <div className="auction-detail">
      <div className="container">
        <div className="breadcrumb">
          <button className="back-btn" onClick={onBack}>
            <i className="fas fa-arrow-left"></i>
            Back to Auctions
          </button>
          <span>/ {getCategoryName(auction.category)} / {auction.subcategory}</span>
        </div>

        <div className="auction-layout">
          <div className="auction-images">
            <div className="main-image">
              <img src={auction.images[selectedImage]} alt={auction.title} />
              <div className="image-overlay">
                <button 
                  className={`watchlist-btn ${watchlisted ? 'active' : ''}`}
                  onClick={handleWatchlist}
                >
                  <i className={`fas fa-heart${watchlisted ? '' : '-o'}`}></i>
                </button>
                <div className="image-counter">
                  {selectedImage + 1} / {auction.images.length}
                </div>
              </div>
            </div>
            <div className="image-thumbnails">
              {auction.images.map((image, index) => (
                <button
                  key={index}
                  className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={image} alt={`View ${index + 1}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="auction-info">
            <div className="auction-header">
              <h1>{auction.title}</h1>
              <div className="auction-meta">
                <span className="condition">Condition: {auction.condition}</span>
                <span className="category">{getCategoryName(auction.category)}</span>
                {auction.authentication && (
                  <span className="authenticated">
                    <i className="fas fa-certificate"></i>
                    {auction.authentication}
                  </span>
                )}
              </div>
            </div>

            <div className="bidding-section">
              <div className="current-bid-info">
                <div className="current-bid">
                  <span className="label">Current Bid:</span>
                  <span className="amount">${auction.currentBid}</span>
                </div>
                <div className="bid-stats">
                  <span>{auction.bidCount} bids</span>
                  <span>Reserve {auction.currentBid >= auction.reservePrice ? 'Met' : 'Not Met'}</span>
                </div>
              </div>

              <div className="time-remaining">
                <span className="label">Time Remaining:</span>
                <div className="countdown">
                  {formatTimeLeft(auction.timeLeft)}
                </div>
                <div className="end-date">
                  Ends: {new Date(auction.endDate).toLocaleString()}
                </div>
              </div>

              <div className="bid-actions">
                <button 
                  className="btn-primary large"
                  onClick={() => setShowBidModal(true)}
                >
                  <i className="fas fa-gavel"></i>
                  Place Bid
                </button>
                {auction.buyNowPrice && (
                  <button className="btn-secondary large">
                    <i className="fas fa-shopping-cart"></i>
                    Buy Now - ${auction.buyNowPrice}
                  </button>
                )}
                <button 
                  className={`btn-outline large ${watchlisted ? 'active' : ''}`}
                  onClick={handleWatchlist}
                >
                  <i className={`fas fa-heart${watchlisted ? '' : '-o'}`}></i>
                  {watchlisted ? 'Watching' : 'Watch Item'}
                </button>
              </div>

              <div className="quick-info">
                <div className="info-item">
                  <span className="label">Starting Bid:</span>
                  <span>${auction.startingBid}</span>
                </div>
                <div className="info-item">
                  <span className="label">Reserve Price:</span>
                  <span>${auction.reservePrice}</span>
                </div>
                <div className="info-item">
                  <span className="label">Shipping:</span>
                  <span>${auction.shipping.cost} ({auction.shipping.time})</span>
                </div>
              </div>
            </div>

            <div className="seller-info">
              <div className="seller-header">
                <h3>Seller Information</h3>
                {auction.seller.verified && (
                  <span className="verified-badge">
                    <i className="fas fa-check-circle"></i>
                    Verified
                  </span>
                )}
              </div>
              <div className="seller-details">
                <div className="seller-name">{auction.seller.name}</div>
                <div className="seller-stats">
                  <span className="rating">
                    ⭐ {auction.seller.rating} ({auction.seller.totalSales} sales)
                  </span>
                  <span className="location">📍 {auction.seller.location}</span>
                  <span className="member-since">Member since {auction.seller.memberSince}</span>
                </div>
              </div>
              <div className="seller-actions">
                <button className="btn-outline">View Profile</button>
                <button className="btn-outline">Contact Seller</button>
                <button className="btn-outline">Other Items</button>
              </div>
            </div>
          </div>
        </div>

        <div className="auction-details">
          <div className="details-tabs">
            <div className="tabs-nav">
              <button className="tab-btn active">Description</button>
              <button className="tab-btn">Specifications</button>
              <button className="tab-btn">Bid History</button>
              <button className="tab-btn">Shipping</button>
            </div>

            <div className="tab-content">
              <div className="description-content">
                <h3>Item Description</h3>
                <p>{auction.description}</p>
                
                <div className="specifications-grid">
                  {auction.specifications.map((spec, index) => (
                    <div key={index} className="spec-item">
                      <span className="spec-label">{spec.label}:</span>
                      <span className="spec-value">{spec.value}</span>
                    </div>
                  ))}
                </div>

                <div className="bid-history">
                  <h4>Recent Bid History</h4>
                  <div className="bid-list">
                    {auction.bidHistory.slice(0, 5).map((bid, index) => (
                      <div key={index} className={`bid-entry ${bid.current ? 'current' : ''}`}>
                        <span className="bidder">{bid.bidder}</span>
                        <span className="bid-amount">${bid.amount}</span>
                        <span className="bid-time">{bid.time}</span>
                        {bid.current && <span className="current-badge">Current High</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="shipping-info">
                  <h4>Shipping & Handling</h4>
                  <div className="shipping-details">
                    <div className="shipping-item">
                      <span className="label">Shipping Cost:</span>
                      <span>${auction.shipping.cost}</span>
                    </div>
                    <div className="shipping-item">
                      <span className="label">Estimated Delivery:</span>
                      <span>{auction.shipping.time}</span>
                    </div>
                    <div className="shipping-item">
                      <span className="label">International Shipping:</span>
                      <span>{auction.shipping.international ? 'Available' : 'Not Available'}</span>
                    </div>
                    <div className="shipping-item">
                      <span className="label">Insurance:</span>
                      <span>{auction.shipping.insurance ? 'Included' : 'Optional'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="related-items">
          <h3>Related Items You Might Like</h3>
          <div className="related-grid">
            {auction.relatedItems.map(item => (
              <div key={item.id} className="related-card">
                <div className="related-image">
                  <img src={item.image} alt={item.title} />
                </div>
                <div className="related-info">
                  <h4>{item.title}</h4>
                  <div className="related-bid">
                    Current Bid: ${item.currentBid}
                  </div>
                  <div className="related-time">
                    {item.timeLeft} left
                  </div>
                </div>
                <button className="btn-outline small">View Item</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showBidModal && (
        <div className="modal-overlay" onClick={() => setShowBidModal(false)}>
          <div className="modal bid-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Place Your Bid</h3>
              <button className="close-btn" onClick={() => setShowBidModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <div className="bid-summary">
                <h4>{auction.title}</h4>
                <div className="current-info">
                  <span>Current Bid: ${auction.currentBid}</span>
                  <span>Minimum Bid: ${auction.currentBid + 5}</span>
                </div>
              </div>
              <div className="bid-input-section">
                <label>Your Bid Amount</label>
                <div className="bid-input-group">
                  <span className="currency">$</span>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`${auction.currentBid + 5}`}
                    min={auction.currentBid + 1}
                    step="1"
                  />
                </div>
                <div className="quick-bids">
                  <button 
                    className="quick-bid-btn"
                    onClick={() => setBidAmount((auction.currentBid + 5).toString())}
                  >
                    +$5
                  </button>
                  <button 
                    className="quick-bid-btn"
                    onClick={() => setBidAmount((auction.currentBid + 10).toString())}
                  >
                    +$10
                  </button>
                  <button 
                    className="quick-bid-btn"
                    onClick={() => setBidAmount((auction.currentBid + 25).toString())}
                  >
                    +$25
                  </button>
                </div>
              </div>
              <div className="bid-terms">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  <span className="checkmark"></span>
                  I agree to the auction terms and conditions
                </label>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setShowBidModal(false)}>
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleBidSubmit}
                disabled={!bidAmount || parseFloat(bidAmount) <= auction.currentBid}
              >
                Place Bid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionDetail;
