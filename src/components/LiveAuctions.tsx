import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useSocket, useNotifications } from '../hooks/useSocket';
import BidModal from './BidModal';
import { AuctionItem } from '../types';

interface LiveAuctionsProps {
  onNavigate?: (page: string, data?: any) => void;
}

interface Auction {
  _id: string;
  title: string;
  description?: string;
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  currentPrice: number;
  startingPrice: number;
  totalBids: number;
  endTime: string;
  startTime: string;
  images: Array<{
    url: string;
    publicId: string;
    alt?: string;
  }>;
  seller: {
    _id: string;
    name?: string;
    shopName?: string;
  };
  condition: string;
  status: string;
  watchers?: string[];
  reservePrice?: number;
  timeRemaining?: number;
}

// Define common auction type for filtering and display
type DisplayAuction = {
  id: string;
  title: string;
  category: string;
  currentBid: number;
  startingBid: number;
  bidCount: number;
  timeLeft: string;
  endTime: string;
  image: string;
  seller: string;
  condition: string;
  isHot: boolean;
  reserveMet: boolean;
  watchers: number;
};

const LiveAuctions: React.FC<LiveAuctionsProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('ending-soon');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Real-time socket connection
  const { isConnected, connectionError } = useSocket();
  const { notifications, unreadCount } = useNotifications();
  
  // Bid modal state
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedAuctionForBid, setSelectedAuctionForBid] = useState<DisplayAuction | null>(null);

  // Fetch auctions from API
  useEffect(() => {
    fetchAuctions();
  }, [selectedCategory, sortBy]);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      console.log('🔍 LiveAuctions: Fetching auctions from API...');
      
      const queryParams = new URLSearchParams();
      
      if (selectedCategory !== 'all') {
        queryParams.append('category', selectedCategory);
      }
      
      if (sortBy) {
        const sortField = sortBy === 'ending-soon' ? 'endTime' : 
                         sortBy === 'newest' ? 'createdAt' : 
                         sortBy === 'price-low' ? 'currentPrice' : 'currentPrice';
        const sortOrder = sortBy === 'price-high' ? 'desc' : 'asc';
        
        queryParams.append('sortBy', sortField);
        queryParams.append('sortOrder', sortOrder);
      }

      const endpoint = `/auctions?${queryParams.toString()}`;
      console.log('📡 LiveAuctions: Making API call to:', endpoint);
      
      const response = await apiService.get(endpoint);
      
      if (response.success) {
        console.log('✅ LiveAuctions: API response successful');
        console.log('📊 LiveAuctions: Number of auctions fetched:', response.data?.length || 0);
        
        if (response.data && response.data.length > 0) {
          console.log('🖼️ LiveAuctions: First auction images:', response.data[0].images);
          // Log image URLs for debugging
          response.data.forEach((auction: any, index: number) => {
            if (auction.images && auction.images.length > 0) {
              console.log(`🖼️ Auction ${index + 1} image:`, auction.images[0].url);
            } else {
              console.log(`❌ Auction ${index + 1} has no images`);
            }
          });
        }
        
        setAuctions(response.data);
        setError('');
      } else {
        console.error('❌ LiveAuctions: API response not successful:', response);
        setError('Failed to fetch auctions');
      }
    } catch (error) {
      console.error('💥 LiveAuctions: Error fetching auctions:', error);
      setError('Failed to load auctions');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (endTime: string): string => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getImageUrl = (auction: Auction): string => {
    console.log('🖼️ getImageUrl called for auction:', auction.title);
    console.log('🖼️ Auction images array:', auction.images);
    
    // Handle database images format: images: [{ url: 'https://...', publicId: '...', alt: '...' }]
    if (auction.images && auction.images.length > 0) {
      const firstImage = auction.images[0];
      console.log('🖼️ First image object:', firstImage);
      console.log('🖼️ Image URL from database:', firstImage.url);
      
      // Check if the image has a proper URL
      if (firstImage.url && firstImage.url.trim() !== '') {
        let imageUrl = firstImage.url;
        
        // The URL should already be a full URL from the backend
        // e.g., "http://localhost:5000/uploads/auctions/1757445995853_40fbd430dbeb39ea.png"
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
          console.log('✅ Using full URL from database:', imageUrl);
          console.log('🧪 Testing URL accessibility by creating test image...');
          
          // Test URL accessibility
          const testImg = new Image();
          testImg.onload = () => console.log('✅ Test image loaded successfully for:', imageUrl);
          testImg.onerror = (err) => console.error('❌ Test image failed to load:', imageUrl, err);
          testImg.src = imageUrl;
          
          return imageUrl;
        }
        
        // If URL starts with /uploads, prepend backend server URL
        if (imageUrl.startsWith('/uploads')) {
          imageUrl = `http://localhost:5000${imageUrl}`;
          console.log('✅ Using local server URL:', imageUrl);
          return imageUrl;
        }
        
        // If URL doesn't start with /, assume it's a relative path from uploads
        if (!imageUrl.startsWith('/')) {
          imageUrl = `http://localhost:5000/uploads/${imageUrl}`;
          console.log('✅ Using constructed URL:', imageUrl);
          return imageUrl;
        }
        
        console.log('✅ Using database image URL as is:', imageUrl);
        return imageUrl;
      }
    }
    
    console.log('⚠️ No valid images found, using fallback for auction:', auction.title);
    
    // Category-specific fallback images for better UX
    const categoryFallbacks: { [key: string]: string } = {
      'textiles': 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=300&fit=crop',
      'pottery': 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=300&fit=crop',
      'jewelry': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop',
      'woodwork': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
      'metalwork': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
      'paintings': 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
      'sculptures': 'https://images.unsplash.com/photo-1612198084106-c7dbb33a4e53?w=400&h=300&fit=crop'
    };
    
    // Return category-specific fallback or default fallback
    const categorySlug = auction.category?.slug || 'default';
    const fallbackUrl = categoryFallbacks[categorySlug] || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop';
    console.log('🔄 Using fallback URL for category', categorySlug, ':', fallbackUrl);
    return fallbackUrl;
  };

  // Image component with error handling and loading states
  const AuctionImage: React.FC<{
    src: string;
    alt: string;
    className?: string;
    fallbackSrc?: string;
  }> = ({ src, alt, className = '', fallbackSrc }) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Sync internal state when src prop changes
    useEffect(() => {
      console.log('🔄 AuctionImage: src prop changed to:', src);
      setImgSrc(src);
      setLoading(true);
      setError(false);
    }, [src]);

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const target = e.target as HTMLImageElement;
      console.log('❌ AuctionImage: Image failed to load:', imgSrc);
      console.log('❌ Error details:', {
        naturalWidth: target.naturalWidth,
        naturalHeight: target.naturalHeight,
        complete: target.complete,
        currentSrc: target.currentSrc
      });
      
      // Check if the URL is reachable
      fetch(imgSrc, { method: 'HEAD' })
        .then(response => {
          console.log('🌐 URL status check:', response.status, response.statusText);
          if (!response.ok) {
            console.log('❌ Server returned error for image:', response.status);
          }
        })
        .catch(err => {
          console.log('❌ Network error accessing image:', err.message);
        });
      
      if (fallbackSrc && imgSrc !== fallbackSrc) {
        console.log('🔄 AuctionImage: Trying fallback:', fallbackSrc);
        setImgSrc(fallbackSrc);
        setError(false); // Reset error state when trying fallback
      } else {
        console.log('💥 AuctionImage: No fallback available, showing error state');
        setError(true);
      }
      setLoading(false);
    };

    const handleLoad = () => {
      console.log('✅ AuctionImage: Image loaded successfully:', imgSrc);
      setLoading(false);
      setError(false);
    };

    return (
      <div className={`auction-image-container ${className}`}>
        {loading && (
          <div className="image-loading">
            <div className="loading-spinner"></div>
          </div>
        )}
        {error ? (
          <div className="image-error">
            <i className="fas fa-image"></i>
            <span>Image not available</span>
          </div>
        ) : (
          <img 
            src={imgSrc} 
            alt={alt}
            onError={handleError}
            onLoad={handleLoad}
            style={{ display: loading ? 'none' : 'block' }}
          />
        )}
      </div>
    );
  };

  const categories = [
    { id: 'all', label: 'All Categories', count: 156 },
    { id: 'textiles', label: 'Textiles', count: 42 },
    { id: 'pottery', label: 'Pottery & Ceramics', count: 28 },
    { id: 'jewelry', label: 'Jewelry', count: 35 },
    { id: 'woodwork', label: 'Woodwork', count: 24 },
    { id: 'metalwork', label: 'Metalwork', count: 18 },
    { id: 'paintings', label: 'Paintings', count: 15 },
    { id: 'sculptures', label: 'Sculptures', count: 12 }
  ];

  // Use real auction data with fallback to mock data for development
  const liveAuctions: DisplayAuction[] = auctions.map(auction => {
    const imageUrl = getImageUrl(auction);
    console.log(`📋 Processing auction "${auction.title}" with image URL:`, imageUrl);
    
    return {
      id: auction._id,
      title: auction.title,
      category: auction.category.name,
      currentBid: auction.currentPrice || auction.startingPrice,
      startingBid: auction.startingPrice,
      bidCount: auction.totalBids || 0,
      timeLeft: formatTimeRemaining(auction.endTime),
      endTime: auction.endTime,
      image: imageUrl,
      seller: auction.seller?.name || auction.seller?.shopName || 'Unknown Seller',
      condition: auction.condition || 'Good',
      isHot: (auction.totalBids || 0) > 5, // Consider auction "hot" if it has more than 5 bids
      reserveMet: (auction.currentPrice || auction.startingPrice) >= (auction.reservePrice || 0),
      watchers: auction.watchers ? auction.watchers.length : Math.floor(Math.random() * 30) + 5
    };
  });

  // Use only real auction data from database
  const allAuctions = liveAuctions;

  const featuredAuctions = allAuctions.filter((auction: DisplayAuction) => auction.isHot).slice(0, 3);
  const endingSoon = [...allAuctions].sort((a: DisplayAuction, b: DisplayAuction) => {
    // Parse time remaining for sorting
    const parseTimeLeft = (timeLeft: string) => {
      if (timeLeft === 'Ended') return 0;
      const parts = timeLeft.split(' ');
      let totalMinutes = 0;
      
      parts.forEach(part => {
        if (part.includes('d')) totalMinutes += parseInt(part) * 24 * 60;
        else if (part.includes('h')) totalMinutes += parseInt(part) * 60;
        else if (part.includes('m')) totalMinutes += parseInt(part);
      });
      
      return totalMinutes;
    };
    
    return parseTimeLeft(a.timeLeft) - parseTimeLeft(b.timeLeft);
  }).slice(0, 4);

  const filteredAuctions = allAuctions.filter((auction: DisplayAuction) => {
    const matchesCategory = selectedCategory === 'all' || auction.category === selectedCategory;
    const matchesSearch = auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         auction.seller.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = (!priceRange.min || auction.currentBid >= parseInt(priceRange.min)) &&
                        (!priceRange.max || auction.currentBid <= parseInt(priceRange.max));
    return matchesCategory && matchesSearch && matchesPrice;
  });

  const sortedAuctions = [...filteredAuctions].sort((a, b) => {
    switch (sortBy) {
      case 'ending-soon':
        return parseFloat(a.timeLeft.split('d')[0]) - parseFloat(b.timeLeft.split('d')[0]);
      case 'price-low':
        return a.currentBid - b.currentBid;
      case 'price-high':
        return b.currentBid - a.currentBid;
      case 'most-bids':
        return b.bidCount - a.bidCount;
      case 'newest':
        return new Date(b.endTime).getTime() - new Date(a.endTime).getTime();
      default:
        return 0;
    }
  });

  const handleAuctionClick = (auction: any) => {
    onNavigate && onNavigate('auction-detail', { auctionId: auction.id });
  };

  const handleBidClick = (auction: DisplayAuction, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent auction click navigation
    setSelectedAuctionForBid(auction);
    setShowBidModal(true);
  };

  const handleBidSubmit = (amount: number) => {
    if (selectedAuctionForBid) {
      console.log(`Placing bid of $${amount} on auction:`, selectedAuctionForBid.title);
      // Bid will be placed via the BidModal's socket integration
      setShowBidModal(false);
      setSelectedAuctionForBid(null);
    }
  };

  const formatTimeLeft = (timeString: string) => {
    const parts = timeString.split(' ');
    return (
      <div className="time-display">
        {parts.map((part, index) => (
          <span key={index} className={`time-part ${part.includes('d') ? 'days' : part.includes('h') ? 'hours' : 'minutes'}`}>
            {part}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="live-auctions">
        <div className="loading-container" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          fontSize: '18px'
        }}>
          Loading auctions...
        </div>
      </div>
    );
  }

  return (
    <div className="live-auctions">
      <div className="auctions-hero">
        <div className="container">
          {/* Real-time Connection Status */}
          <div className="connection-status">
            {isConnected ? (
              <div className="status-connected">
                🟢 Real-time bidding active
              </div>
            ) : (
              <div className="status-disconnected">
                🟡 {connectionError || 'Connecting to real-time updates...'}
              </div>
            )}
          </div>

          {/* Notifications */}
          {unreadCount > 0 && (
            <div className="notification-banner">
              🔔 You have {unreadCount} new notifications
            </div>
          )}

          <div className="hero-content">
            <h1>Live Auctions</h1>
            <p>Discover unique handicrafts from artisans around the world</p>
            <div className="auction-stats">
              <div className="stat">
                <span className="number">{allAuctions.length}</span>
                <span className="label">Active Auctions</span>
              </div>
              <div className="stat">
                <span className="number">{endingSoon.length}</span>
                <span className="label">Ending Soon</span>
              </div>
              <div className="stat">
                <span className="number">{featuredAuctions.length}</span>
                <span className="label">Hot Items</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Debug Information */}
        {auctions.length > 0 && (
          <div className="debug-section">
            <h4>🔍 Debug Info</h4>
            <p><strong>Total auctions loaded:</strong> {auctions.length}</p>
            <p><strong>Filtered auctions:</strong> {sortedAuctions.length}</p>
            {auctions.length > 0 && (
              <div>
                <p><strong>First auction title:</strong> {auctions[0].title}</p>
                <p><strong>First auction images:</strong> {JSON.stringify(auctions[0].images, null, 2)}</p>
                <p><strong>Generated image URL:</strong> {getImageUrl(auctions[0])}</p>
                
                {/* Test image display directly */}
                <div style={{ margin: '1rem 0' }}>
                  <p><strong>Direct Image Test:</strong></p>
                  <div style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <p><strong>Generated URL:</strong></p>
                      <code className="debug-url">
                        {getImageUrl(auctions[0])}
                      </code>
                    </div>
                    <div>
                      <p><strong>Raw Database URL:</strong></p>
                      <code className="debug-url">
                        {auctions[0].images[0]?.url || 'No URL'}
                      </code>
                    </div>
                  </div>
                  <img 
                    src={getImageUrl(auctions[0])} 
                    alt={auctions[0].title}
                    style={{
                      maxWidth: '200px',
                      maxHeight: '150px',
                      border: '2px solid #007bff',
                      borderRadius: '4px',
                      display: 'block'
                    }}
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      console.error('❌ Debug image failed:', img.src);
                      console.error('❌ Image element details:', {
                        naturalWidth: img.naturalWidth,
                        naturalHeight: img.naturalHeight,
                        complete: img.complete
                      });
                    }}
                    onLoad={(e) => {
                      const img = e.target as HTMLImageElement;
                      console.log('✅ Debug image loaded successfully!', {
                        src: img.src,
                        naturalWidth: img.naturalWidth,
                        naturalHeight: img.naturalHeight
                      });
                    }}
                  />
                  
                  {/* Add a direct browser test link */}
                  <div style={{ marginTop: '0.5rem' }}>
                    <a 
                      href={getImageUrl(auctions[0])} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        color: '#007bff', 
                        textDecoration: 'none',
                        fontSize: '12px'
                      }}
                    >
                      🔗 Open image in new tab
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      
        <div className="search-filters">
          <div className="search-bar">
            <div className="search-input-group">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search auctions, sellers, or items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              className="filter-toggle"
              onClick={() => setShowFilters(!showFilters)}
            >
              <i className="fas fa-filter"></i>
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="filters-panel">
              <div className="filter-group">
                <label>Price Range</label>
                <div className="price-inputs">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                  />
                  <span>to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                  />
                </div>
              </div>
              <div className="filter-group">
                <label>Sort By</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="ending-soon">Ending Soon</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="most-bids">Most Bids</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="categories-nav">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.label} ({category.count})
            </button>
          ))}
        </div>

        <div className="featured-section">
          <h2>🔥 Hot Auctions</h2>
          <div className="featured-grid">
            {featuredAuctions.map((auction: DisplayAuction) => (
              <div key={auction.id} className="featured-card" onClick={() => handleAuctionClick(auction)}>
                <div className="featured-image">
                  <AuctionImage 
                    src={auction.image} 
                    alt={auction.title}
                    className="featured-img"
                    fallbackSrc="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"
                  />
                  <div className="featured-overlay">
                    <span className="hot-badge">🔥 HOT</span>
                    <div className="watchers">
                      <i className="fas fa-eye"></i>
                      {auction.watchers}
                    </div>
                  </div>
                </div>
                <div className="featured-content">
                  <h3>{auction.title}</h3>
                  <div className="featured-stats">
                    <div className="current-bid">
                      <span className="label">Current Bid:</span>
                      <span className="amount">${auction.currentBid}</span>
                    </div>
                    <div className="bid-count">{auction.bidCount} bids</div>
                  </div>
                  <div className="time-remaining">
                    {formatTimeLeft(auction.timeLeft)}
                  </div>
                  <button 
                    className="btn-primary"
                    onClick={(e) => handleBidClick(auction, e)}
                  >
                    🔴 Live Bid
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ending-soon-section">
          <h2>⏰ Ending Soon</h2>
          <div className="ending-soon-grid">
            {endingSoon.map(auction => (
              <div key={auction.id} className="ending-soon-card" onClick={() => handleAuctionClick(auction)}>
                <div className="card-image">
                  <AuctionImage 
                    src={auction.image} 
                    alt={auction.title}
                    className="ending-img"
                    fallbackSrc="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"
                  />
                  <div className="time-badge">
                    {auction.timeLeft.split(' ')[0]}
                  </div>
                </div>
                <div className="card-content">
                  <h4>{auction.title}</h4>
                  <div className="price-info">
                    <span className="current-bid">${auction.currentBid}</span>
                    <span className="bid-count">({auction.bidCount} bids)</span>
                  </div>
                  <div className="seller">by {auction.seller}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="all-auctions-section">
          <div className="section-header">
            <h2>All Auctions ({sortedAuctions.length})</h2>
            <div className="view-controls">
              <button className="view-btn grid active">
                <i className="fas fa-th"></i>
              </button>
              <button className="view-btn list">
                <i className="fas fa-list"></i>
              </button>
            </div>
          </div>

          <div className="auctions-grid">
            {sortedAuctions.map(auction => (
              <div key={auction.id} className="auction-card" onClick={() => handleAuctionClick(auction)}>
                <div className="card-image">
                  <AuctionImage 
                    src={auction.image} 
                    alt={auction.title}
                    className="auction-img"
                    fallbackSrc="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"
                  />
                  <div className="image-overlay">
                    {auction.isHot && <span className="hot-badge">🔥</span>}
                    <button className="watchlist-btn">
                      <i className="far fa-heart"></i>
                    </button>
                    <div className="condition-badge">{auction.condition}</div>
                  </div>
                </div>
                <div className="card-content">
                  <div className="auction-header">
                    <h3>{auction.title}</h3>
                    <span className="category-tag">{auction.category}</span>
                  </div>
                  <div className="seller-info">
                    <span>by {auction.seller}</span>
                  </div>
                  <div className="bid-info">
                    <div className="current-bid">
                      <span className="label">Current Bid:</span>
                      <span className="amount">${auction.currentBid}</span>
                    </div>
                    <div className="bid-stats">
                      <span>{auction.bidCount} bids</span>
                      <span className={`reserve ${auction.reserveMet ? 'met' : 'not-met'}`}>
                        Reserve {auction.reserveMet ? 'Met' : 'Not Met'}
                      </span>
                    </div>
                  </div>
                  <div className="time-remaining">
                    <i className="fas fa-clock"></i>
                    {formatTimeLeft(auction.timeLeft)}
                  </div>
                  <div className="watchers-count">
                    <i className="fas fa-eye"></i>
                    {auction.watchers} watching
                  </div>
                  <div className="card-actions">
                    <button 
                      className="btn-primary"
                      onClick={(e) => handleBidClick(auction, e)}
                    >
                      🔴 Live Bid
                    </button>
                    <button className="btn-outline">Watch</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="auction-tips">
          <h3>Bidding Tips</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <i className="fas fa-clock"></i>
              <h4>Time Your Bids</h4>
              <p>Consider bidding in the final moments for the best chance of winning</p>
            </div>
            <div className="tip-card">
              <i className="fas fa-search"></i>
              <h4>Research Items</h4>
              <p>Check the item description, condition, and seller rating before bidding</p>
            </div>
            <div className="tip-card">
              <i className="fas fa-dollar-sign"></i>
              <h4>Set a Budget</h4>
              <p>Decide your maximum bid beforehand and stick to it</p>
            </div>
            <div className="tip-card">
              <i className="fas fa-heart"></i>
              <h4>Use Watchlist</h4>
              <p>Save items you're interested in to track their progress</p>
            </div>
          </div>
        </div>

        {/* Real-time Bid Modal */}
        {showBidModal && selectedAuctionForBid && (
          <BidModal
            item={{
              id: selectedAuctionForBid.id,
              title: selectedAuctionForBid.title,
              currentBid: selectedAuctionForBid.currentBid,
              image: selectedAuctionForBid.image,
              timeLeft: selectedAuctionForBid.timeLeft,
              seller: selectedAuctionForBid.seller,
              category: selectedAuctionForBid.category,
              condition: selectedAuctionForBid.condition,
              watchers: selectedAuctionForBid.watchers,
              bidCount: selectedAuctionForBid.bidCount,
              startingBid: selectedAuctionForBid.startingBid,
              endTime: selectedAuctionForBid.endTime,
              isHot: selectedAuctionForBid.isHot,
              reserveMet: selectedAuctionForBid.reserveMet
            }}
            onClose={() => {
              setShowBidModal(false);
              setSelectedAuctionForBid(null);
            }}
            onSubmit={handleBidSubmit}
          />
        )}
      </div>

      <style>{`
        .connection-status {
          margin-bottom: 1rem;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 14px;
        }

        .status-connected {
          background: #d1fae5;
          color: #047857;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-disconnected {
          background: #fef3c7;
          color: #92400e;
        }

        .notification-banner {
          background: #dbeafe;
          color: #1e40af;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          text-align: center;
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .card-actions button {
          transition: all 0.2s ease;
        }

        .featured-card:hover .btn-primary {
          background: #dc2626;
        }

        .auction-card:hover .btn-primary {
          background: #dc2626;
        }

        /* Enhanced image styling and debugging */
        .auction-image-container {
          position: relative;
          width: 100%;
          height: 200px;
          overflow: hidden;
          background-color: #f8f9fa;
          border-radius: 8px;
        }

        .auction-image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .auction-image-container:hover img {
          transform: scale(1.05);
        }

        .image-loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .image-error {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          color: #6c757d;
          text-align: center;
          padding: 1rem;
        }

        .image-error i {
          font-size: 2rem;
          opacity: 0.5;
        }

        .image-error span {
          font-size: 0.875rem;
        }

        /* Debug section styling */
        .debug-section {
          background-color: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          padding: 1rem;
          margin-bottom: 2rem;
          font-size: 14px;
        }

        .debug-section h4 {
          margin-bottom: 0.5rem;
          color: #495057;
        }

        .debug-url {
          background: #f8f9fa;
          padding: 0.25rem;
          border-radius: 3px;
          font-size: 12px;
          word-break: break-all;
          font-family: monospace;
        }
      `}</style>
    </div>
  );
};

export default LiveAuctions;
