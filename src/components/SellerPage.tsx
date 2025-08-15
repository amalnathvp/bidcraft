import React, { useState } from 'react';

interface SellerPageProps {
  onNavigate?: (page: string) => void;
  user?: any;
}

const SellerPage: React.FC<SellerPageProps> = ({ onNavigate, user }) => {
  const [showSellForm, setShowSellForm] = useState(false);

  const sellingSteps = [
    {
      icon: 'fas fa-user-plus',
      title: 'Create Seller Account',
      description: 'Sign up as a seller and verify your identity with our secure verification process.',
      details: [
        'Complete seller registration form',
        'Verify your identity documents',
        'Set up payment information',
        'Get approved within 24-48 hours'
      ]
    },
    {
      icon: 'fas fa-camera',
      title: 'Photograph Your Items',
      description: 'Take high-quality photos of your handicrafts from multiple angles.',
      details: [
        'Use natural lighting for best results',
        'Take at least 5-8 photos per item',
        'Show close-ups of unique details',
        'Include size reference objects'
      ]
    },
    {
      icon: 'fas fa-edit',
      title: 'Create Listing',
      description: 'Provide detailed information about your handicraft including materials, origin, and history.',
      details: [
        'Write compelling item descriptions',
        'Set starting bid and reserve price',
        'Choose auction duration (3-10 days)',
        'Add relevant tags and categories'
      ]
    },
    {
      icon: 'fas fa-gavel',
      title: 'Auction Goes Live',
      description: 'Your item is now live and visible to thousands of potential bidders worldwide.',
      details: [
        'Monitor bidding activity',
        'Answer buyer questions',
        'Promote on social media',
        'Watch your profits grow'
      ]
    },
    {
      icon: 'fas fa-shipping-fast',
      title: 'Ship & Get Paid',
      description: 'Once the auction ends, ship the item and receive payment securely.',
      details: [
        'Pack items carefully and securely',
        'Use insured shipping methods',
        'Provide tracking information',
        'Get paid within 2-3 business days'
      ]
    }
  ];

  const benefits = [
    {
      icon: 'fas fa-globe',
      title: 'Global Reach',
      description: 'Access to customers worldwide who appreciate authentic handicrafts'
    },
    {
      icon: 'fas fa-shield-alt',
      title: 'Secure Payments',
      description: 'Protected transactions with guaranteed payment for completed sales'
    },
    {
      icon: 'fas fa-chart-line',
      title: 'Fair Pricing',
      description: 'Auction format ensures you get the best market price for your items'
    },
    {
      icon: 'fas fa-headset',
      title: '24/7 Support',
      description: 'Dedicated seller support team to help you succeed'
    },
    {
      icon: 'fas fa-tags',
      title: 'Low Fees',
      description: 'Competitive commission rates with no listing fees'
    },
    {
      icon: 'fas fa-tools',
      title: 'Seller Tools',
      description: 'Professional tools to manage your listings and track performance'
    }
  ];

  const requirements = [
    'Items must be authentic handicrafts or artisan-made products',
    'Minimum age of 18 years to become a seller',
    'Valid government-issued ID for verification',
    'Bank account for payment processing',
    'Ability to ship items safely and on time',
    'Compliance with all local and international trade laws'
  ];

  const handleStartSelling = () => {
    if (!user) {
      // For non-logged in users, create a demo seller session
      if (onNavigate) {
        onNavigate('seller-dashboard');
      }
    } else if (user.accountType === 'bidder') {
      // Show upgrade to seller account form
      setShowSellForm(true);
    } else {
      // User is already a seller, redirect to dashboard
      if (onNavigate) {
        onNavigate('seller-dashboard');
      }
    }
  };

  return (
    <div className="seller-page">
      {/* Hero Section */}
      <section className="seller-hero">
        <div className="container">
          <div className="seller-hero-content">
            <div className="hero-text">
              <h1>Turn Your Handicrafts Into Profit</h1>
              <p className="large-text">
                Join thousands of artisans selling their authentic handicrafts to collectors worldwide. 
                BidCraft makes it easy to reach the right buyers and get the best prices for your creations.
              </p>
              <div className="hero-stats">
                <div className="stat">
                  <span className="stat-number">50K+</span>
                  <span className="stat-label">Active Buyers</span>
                </div>
                <div className="stat">
                  <span className="stat-number">$2.5M+</span>
                  <span className="stat-label">Items Sold</span>
                </div>
                <div className="stat">
                  <span className="stat-number">180+</span>
                  <span className="stat-label">Countries</span>
                </div>
              </div>
              <button 
                className="btn-primary large"
                onClick={handleStartSelling}
              >
                {!user ? 'Start Selling Today' : user.accountType === 'bidder' ? 'Upgrade to Seller' : 'Go to Dashboard'}
              </button>
              {user && (user.accountType === 'seller' || user.accountType === 'both') && (
                <button 
                  className="btn-outline large"
                  onClick={() => setShowSellForm(true)}
                >
                  List New Item
                </button>
              )}
              {!user && (
                <button 
                  className="btn-outline large"
                  onClick={handleStartSelling}
                >
                  Try Demo Dashboard
                </button>
              )}
            </div>
            <div className="hero-image">
              <div className="seller-showcase">
                <div className="showcase-item">
                  <img src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop" alt="Handmade pottery" />
                  <div className="showcase-overlay">
                    <span className="sold-badge">SOLD</span>
                    <span className="price">$340</span>
                  </div>
                </div>
                <div className="showcase-item">
                  <img src="https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=300&h=200&fit=crop" alt="Woven basket" />
                  <div className="showcase-overlay">
                    <span className="live-badge">LIVE</span>
                    <span className="price">$125</span>
                  </div>
                </div>
                <div className="showcase-item">
                  <img src="https://images.unsplash.com/photo-1611432579402-7037e3e2ee29?w=300&h=200&fit=crop" alt="Carved wood" />
                  <div className="showcase-overlay">
                    <span className="upcoming-badge">UPCOMING</span>
                    <span className="price">Est. $200</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-to-sell">
        <div className="container">
          <div className="section-header">
            <h2>How to Start Selling</h2>
            <p>Follow these simple steps to begin your selling journey on BidCraft</p>
          </div>
          
          <div className="selling-steps">
            {sellingSteps.map((step, index) => (
              <div key={index} className="selling-step">
                <div className="step-icon">
                  <i className={step.icon}></i>
                  <span className="step-number">{index + 1}</span>
                </div>
                <div className="step-content">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  <ul className="step-details">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex}>
                        <i className="fas fa-check"></i>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="seller-benefits">
        <div className="container">
          <div className="section-header">
            <h2>Why Sell on BidCraft?</h2>
            <p>Join a platform designed specifically for handicraft artisans and collectors</p>
          </div>
          
          <div className="benefits-grid">
            {benefits.map((benefit, index) => (
              <div key={index} className="benefit-card">
                <div className="benefit-icon">
                  <i className={benefit.icon}></i>
                </div>
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="seller-requirements">
        <div className="container">
          <div className="requirements-content">
            <div className="requirements-text">
              <h2>Seller Requirements</h2>
              <p>To maintain the quality and authenticity of items on our platform, we have the following requirements:</p>
              <ul className="requirements-list">
                {requirements.map((requirement, index) => (
                  <li key={index}>
                    <i className="fas fa-check-circle"></i>
                    {requirement}
                  </li>
                ))}
              </ul>
              <div className="fee-info">
                <h3>Commission Structure</h3>
                <div className="fee-tiers">
                  <div className="fee-tier">
                    <span className="tier-label">Final Sale Value</span>
                    <span className="tier-rate">Commission Rate</span>
                  </div>
                  <div className="fee-tier">
                    <span className="tier-label">$0 - $100</span>
                    <span className="tier-rate">8%</span>
                  </div>
                  <div className="fee-tier">
                    <span className="tier-label">$101 - $500</span>
                    <span className="tier-rate">6%</span>
                  </div>
                  <div className="fee-tier">
                    <span className="tier-label">$501+</span>
                    <span className="tier-rate">4%</span>
                  </div>
                </div>
                <p className="fee-note">
                  <i className="fas fa-info-circle"></i>
                  No listing fees • No monthly fees • Get paid within 2-3 business days
                </p>
              </div>
            </div>
            <div className="requirements-image">
              <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&h=400&fit=crop" alt="Artisan working" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="seller-cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Start Your Selling Journey?</h2>
            <p>Join our community of successful artisans and turn your passion into profit</p>
            <div className="cta-buttons">
              <button 
                className="btn-primary large"
                onClick={handleStartSelling}
              >
                {!user ? 'Start Selling Today' : user.accountType === 'bidder' ? 'Upgrade Account' : 'Go to Dashboard'}
              </button>
              {user && (user.accountType === 'seller' || user.accountType === 'both') ? (
                <button 
                  className="btn-outline large"
                  onClick={() => setShowSellForm(true)}
                >
                  List New Item
                </button>
              ) : (
                <button 
                  className="btn-outline large"
                  onClick={handleStartSelling}
                >
                  Try Demo Dashboard
                </button>
              )}
            </div>
            <p className="cta-note">
              Questions? <a href="#" className="contact-link">Contact our seller support team</a>
            </p>
          </div>
        </div>
      </section>

      {/* Sell Item Modal/Form */}
      {showSellForm && (
        <SellItemModal 
          onClose={() => setShowSellForm(false)}
          user={user}
        />
      )}
    </div>
  );
};

// Sell Item Modal Component
interface SellItemModalProps {
  onClose: () => void;
  user?: any;
}

const SellItemModal: React.FC<SellItemModalProps> = ({ onClose, user }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    materials: '',
    origin: '',
    dimensions: '',
    weight: '',
    startingBid: '',
    reservePrice: '',
    auctionDuration: '7',
    shippingInfo: '',
    images: [] as File[]
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        images: Array.from(e.target.files || [])
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Sell item form submitted:', formData);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content sell-item-modal">
        <button className="modal-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
        
        <div className="modal-header">
          <h2>List Your Handicraft</h2>
          <p>Provide details about your item to attract the right buyers</p>
        </div>

        <form onSubmit={handleSubmit} className="sell-item-form">
          <div className="form-section">
            <h3>Item Information</h3>
            
            <div className="form-group">
              <label htmlFor="title">Item Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Handwoven Kashmiri Pashmina Shawl"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Describe your item's history, craftsmanship, and unique features..."
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="textiles">Textiles & Fabrics</option>
                  <option value="pottery">Pottery & Ceramics</option>
                  <option value="jewelry">Jewelry & Accessories</option>
                  <option value="woodwork">Woodwork & Carving</option>
                  <option value="metalwork">Metalwork</option>
                  <option value="paintings">Paintings & Art</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="materials">Materials Used *</label>
                <input
                  type="text"
                  id="materials"
                  name="materials"
                  value={formData.materials}
                  onChange={handleInputChange}
                  placeholder="e.g., Pashmina wool, silk"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="origin">Origin/Region</label>
                <input
                  type="text"
                  id="origin"
                  name="origin"
                  value={formData.origin}
                  onChange={handleInputChange}
                  placeholder="e.g., Kashmir, India"
                />
              </div>

              <div className="form-group">
                <label htmlFor="dimensions">Dimensions</label>
                <input
                  type="text"
                  id="dimensions"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleInputChange}
                  placeholder="e.g., 70cm x 200cm"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Auction Settings</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startingBid">Starting Bid ($) *</label>
                <input
                  type="number"
                  id="startingBid"
                  name="startingBid"
                  value={formData.startingBid}
                  onChange={handleInputChange}
                  placeholder="25"
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reservePrice">Reserve Price ($)</label>
                <input
                  type="number"
                  id="reservePrice"
                  name="reservePrice"
                  value={formData.reservePrice}
                  onChange={handleInputChange}
                  placeholder="100"
                  min="1"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="auctionDuration">Auction Duration</label>
              <select
                id="auctionDuration"
                name="auctionDuration"
                value={formData.auctionDuration}
                onChange={handleInputChange}
              >
                <option value="3">3 Days</option>
                <option value="5">5 Days</option>
                <option value="7">7 Days (Recommended)</option>
                <option value="10">10 Days</option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3>Images</h3>
            <div className="form-group">
              <label htmlFor="images">Upload Images * (5-8 photos recommended)</label>
              <input
                type="file"
                id="images"
                name="images"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                required
              />
              <p className="form-help">
                Upload high-quality images showing different angles and details. First image will be the main listing photo.
              </p>
            </div>
          </div>

          <div className="form-section">
            <h3>Shipping Information</h3>
            <div className="form-group">
              <label htmlFor="shippingInfo">Shipping Details</label>
              <textarea
                id="shippingInfo"
                name="shippingInfo"
                value={formData.shippingInfo}
                onChange={handleInputChange}
                rows={3}
                placeholder="Shipping costs, handling time, international shipping availability..."
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-outline" onClick={onClose}>
              Save as Draft
            </button>
            <button type="submit" className="btn-primary">
              List Item for Auction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellerPage;
