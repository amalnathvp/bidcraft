import React, { useState } from 'react';

interface AuctionDetailProps {
  auctionId: string;
  onNavigate?: (page: string) => void;
  onBack?: () => void;
}

const AuctionDetail: React.FC<AuctionDetailProps> = ({ auctionId, onNavigate, onBack }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [bidAmount, setBidAmount] = useState('');
  const [watchlisted, setWatchlisted] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);

  // Mock auction data - in real app this would come from API
  const auction = {
    id: auctionId,
    title: "Vintage Kashmiri Pashmina Shawl",
    description: "Exquisite hand-woven Kashmiri Pashmina shawl featuring intricate traditional patterns. This authentic piece showcases the finest craftsmanship from the Kashmir valley, made from 100% pure Pashmina wool. The shawl displays beautiful floral motifs in rich burgundy and gold threads, representing centuries-old weaving traditions.",
    images: [
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=600&h=400&fit=crop"
    ],
    currentBid: 285,
    startingBid: 150,
    reservePrice: 200,
    buyNowPrice: 450,
    bidCount: 8,
    timeLeft: "2d 14h 32m",
    endDate: "2025-08-18 18:30:00",
    seller: {
      name: "KashmirCrafts",
      rating: 4.9,
      totalSales: 156,
      location: "Srinagar, Kashmir",
      memberSince: "2019",
      verified: true
    },
    category: "Textiles",
    subcategory: "Shawls & Wraps",
    condition: "Excellent",
    era: "Contemporary (Post-1960)",
    material: "100% Pashmina Wool",
    dimensions: "200cm x 70cm",
    weight: "150g",
    origin: "Kashmir, India",
    authentication: "Certified Authentic",
    shipping: {
      cost: 15,
      time: "3-5 business days",
      international: true,
      insurance: true
    },
    bidHistory: [
      { bidder: "ArtLover123", amount: 285, time: "2 hours ago", current: true },
      { bidder: "Collector456", amount: 275, time: "4 hours ago", current: false },
      { bidder: "VintageHunter", amount: 265, time: "6 hours ago", current: false },
      { bidder: "HandmadeFan", amount: 255, time: "8 hours ago", current: false },
      { bidder: "TextileExpert", amount: 245, time: "1 day ago", current: false },
      { bidder: "CraftCollector", amount: 235, time: "1 day ago", current: false },
      { bidder: "ArtisanLover", amount: 225, time: "1 day ago", current: false },
      { bidder: "HeritageSeeker", amount: 150, time: "2 days ago", current: false }
    ],
    specifications: [
      { label: "Material", value: "100% Pashmina Wool" },
      { label: "Weave Type", value: "Traditional Hand-woven" },
      { label: "Pattern", value: "Floral Paisley" },
      { label: "Colors", value: "Burgundy, Gold, Cream" },
      { label: "Care Instructions", value: "Dry Clean Only" },
      { label: "Provenance", value: "Kashmir Valley Workshop" }
    ],
    relatedItems: [
      {
        id: "2",
        title: "Silk Kashmiri Scarf",
        currentBid: 125,
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&h=150&fit=crop",
        timeLeft: "1d 8h"
      },
      {
        id: "3",
        title: "Embroidered Pashmina",
        currentBid: 195,
        image: "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=200&h=150&fit=crop",
        timeLeft: "3d 12h"
      },
      {
        id: "4",
        title: "Traditional Wool Shawl",
        currentBid: 165,
        image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=200&h=150&fit=crop",
        timeLeft: "5d 2h"
      }
    ]
  };

  const handleBidSubmit = () => {
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
          <span>/ {auction.category} / {auction.subcategory}</span>
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
                <span className="category">{auction.category}</span>
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
