import React from 'react';

interface HeroProps {
  onGetStarted: () => void;
}

const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  return (
    <section id="home" className="hero">
      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-title">
            Discover Authentic <span className="highlight">Handicrafts</span>
          </h1>
          <p className="hero-description">
            Join the premier auction platform for authentic handcrafted treasures. 
            Bid on unique pieces created by skilled artisans from around the world.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary large" onClick={onGetStarted}>
              Start Bidding
            </button>
            <button className="btn-outline large">
              Explore Auctions
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">10,000+</span>
              <span className="stat-label">Unique Items</span>
            </div>
            <div className="stat">
              <span className="stat-number">5,000+</span>
              <span className="stat-label">Happy Bidders</span>
            </div>
            <div className="stat">
              <span className="stat-number">500+</span>
              <span className="stat-label">Artisans</span>
            </div>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-card">
            <img 
              src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center" 
              alt="Handcrafted pottery"
            />
            <div className="card-overlay">
              <span className="live-indicator">LIVE AUCTION</span>
              <h3>Artisan Pottery Collection</h3>
              <p className="current-bid">Current Bid: $150</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
