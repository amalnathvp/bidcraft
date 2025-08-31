import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auctionService } from '../services/auctionService';

interface AdminAuctionManagementProps {
  onNavigate: (page: string, data?: any) => void;
}

interface Auction {
  _id: string;
  title: string;
  seller: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  currentBid: number;
  startingPrice: number;
  status: 'active' | 'ended' | 'cancelled' | 'draft';
  endTime: string;
  startTime: string;
  category: string;
  images: string[];
  totalBids: number;
  featured: boolean;
  reported: boolean;
}

const AdminAuctionManagement: React.FC<AdminAuctionManagementProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [filteredAuctions, setFilteredAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('endTime');
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Load auctions data
  useEffect(() => {
    const loadAuctions = async () => {
      try {
        console.log('Loading auctions for admin...');
        const response = await auctionService.getAuctions();
        console.log('Admin auctions response:', response);
        
        if (response.success && response.data) {
          setAuctions(response.data);
          setFilteredAuctions(response.data);
        } else {
          console.error('Failed to load auctions:', response.message);
        }
      } catch (error) {
        console.error('Error loading auctions:', error);
        // Mock data fallback
        const mockAuctions: Auction[] = [
          {
            _id: '1',
            title: 'Vintage Handwoven Rug',
            seller: {
              _id: 'seller1',
              firstName: 'John',
              lastName: 'Smith',
              email: 'john@example.com'
            },
            currentBid: 250,
            startingPrice: 100,
            status: 'active',
            endTime: '2025-09-02T18:00:00Z',
            startTime: '2025-08-28T10:00:00Z',
            category: 'Textiles',
            images: ['image1.jpg'],
            totalBids: 12,
            featured: true,
            reported: false
          }
        ];
        setAuctions(mockAuctions);
        setFilteredAuctions(mockAuctions);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'admin') {
      loadAuctions();
    }
  }, [user]);

  // Filter and sort auctions
  useEffect(() => {
    let filtered = auctions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(auction =>
        auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.seller.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.seller.lastName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(auction => auction.status === filterStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'endTime':
          return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
        case 'currentBid':
          return b.currentBid - a.currentBid;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredAuctions(filtered);
  }, [auctions, searchTerm, filterStatus, sortBy]);

  const handleAuctionAction = async (auctionId: string, action: string) => {
    try {
      console.log(`Performing ${action} on auction ${auctionId}`);
      
      switch (action) {
        case 'feature':
          // Call API to feature auction
          setAuctions(auctions.map(auction => 
            auction._id === auctionId ? { ...auction, featured: !auction.featured } : auction
          ));
          break;
        case 'cancel':
          if (window.confirm('Are you sure you want to cancel this auction?')) {
            setAuctions(auctions.map(auction => 
              auction._id === auctionId ? { ...auction, status: 'cancelled' as const } : auction
            ));
          }
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this auction? This action cannot be undone.')) {
            await auctionService.deleteAuction(auctionId);
            setAuctions(auctions.filter(auction => auction._id !== auctionId));
          }
          break;
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      alert(`Failed to ${action} auction. Please try again.`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'ended': return '#6B7280';
      case 'cancelled': return '#EF4444';
      case 'draft': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getTimeRemaining = (endTime: string) => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (!user || user.role !== 'admin') {
    return <div>Access denied. Admin privileges required.</div>;
  }

  if (loading) {
    return (
      <div className="admin-auctions loading">
        <div className="container">
          <h1>Loading Auctions...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-auctions">
      <div className="container">
        {/* Header */}
        <div className="admin-header">
          <button 
            className="back-button"
            onClick={() => onNavigate('admin-dashboard')}
          >
            ← Back to Dashboard
          </button>
          <h1>Auction Management</h1>
          <p>View, moderate, and manage all auctions on the platform</p>
        </div>

        {/* Filters and Controls */}
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search auctions by title or seller..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-controls">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="ended">Ended</option>
              <option value="cancelled">Cancelled</option>
              <option value="draft">Draft</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="endTime">Sort by End Time</option>
              <option value="currentBid">Sort by Current Bid</option>
              <option value="title">Sort by Title</option>
            </select>
          </div>
        </div>

        {/* Auction Stats */}
        <div className="auction-stats">
          <div className="stat-item">
            <span className="count">{auctions.length}</span>
            <span className="label">Total Auctions</span>
          </div>
          <div className="stat-item">
            <span className="count">{auctions.filter(a => a.status === 'active').length}</span>
            <span className="label">Active</span>
          </div>
          <div className="stat-item">
            <span className="count">{auctions.filter(a => a.featured).length}</span>
            <span className="label">Featured</span>
          </div>
          <div className="stat-item">
            <span className="count">{auctions.filter(a => a.reported).length}</span>
            <span className="label">Reported</span>
          </div>
        </div>

        {/* Auctions Table */}
        <div className="auctions-table">
          <div className="table-header">
            <div>Auction</div>
            <div>Seller</div>
            <div>Price</div>
            <div>Status</div>
            <div>Time</div>
            <div>Actions</div>
          </div>

          {filteredAuctions.map(auction => (
            <div key={auction._id} className="table-row">
              <div className="auction-info">
                <div className="auction-image">
                  {auction.images.length > 0 ? (
                    <img src={auction.images[0]} alt={auction.title} />
                  ) : (
                    <div className="no-image">📷</div>
                  )}
                </div>
                <div className="auction-details">
                  <div className="auction-title">
                    {auction.title}
                    {auction.featured && <span className="featured-badge">⭐</span>}
                    {auction.reported && <span className="reported-badge">🚨</span>}
                  </div>
                  <div className="auction-category">{auction.category}</div>
                </div>
              </div>

              <div className="seller-info">
                <div>{auction.seller.firstName} {auction.seller.lastName}</div>
                <div className="seller-email">{auction.seller.email}</div>
              </div>

              <div className="price-info">
                <div className="current-bid">${auction.currentBid}</div>
                <div className="starting-price">Started: ${auction.startingPrice}</div>
                <div className="bid-count">{auction.totalBids} bids</div>
              </div>

              <div className="status-info">
                <span 
                  className="status-indicator"
                  style={{ backgroundColor: getStatusColor(auction.status) }}
                >
                  {auction.status.charAt(0).toUpperCase() + auction.status.slice(1)}
                </span>
              </div>

              <div className="time-info">
                <div>Ends: {getTimeRemaining(auction.endTime)}</div>
                <div className="end-date">
                  {new Date(auction.endTime).toLocaleDateString()}
                </div>
              </div>

              <div className="auction-actions">
                <button
                  className="action-btn view"
                  onClick={() => {
                    setSelectedAuction(auction);
                    setShowModal(true);
                  }}
                >
                  View
                </button>

                <button
                  className={`action-btn ${auction.featured ? 'unfeature' : 'feature'}`}
                  onClick={() => handleAuctionAction(auction._id, 'feature')}
                >
                  {auction.featured ? 'Unfeature' : 'Feature'}
                </button>

                {auction.status === 'active' && (
                  <button
                    className="action-btn cancel"
                    onClick={() => handleAuctionAction(auction._id, 'cancel')}
                  >
                    Cancel
                  </button>
                )}

                <button
                  className="action-btn delete"
                  onClick={() => handleAuctionAction(auction._id, 'delete')}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredAuctions.length === 0 && (
          <div className="no-results">
            <h3>No auctions found</h3>
            <p>Try adjusting your search or filter criteria.</p>
          </div>
        )}

        {/* Auction Detail Modal */}
        {showModal && selectedAuction && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Auction Details</h2>
                <button
                  className="close-button"
                  onClick={() => setShowModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="auction-detail-content">
                <div className="detail-section">
                  <h3>Basic Information</h3>
                  <p><strong>Title:</strong> {selectedAuction.title}</p>
                  <p><strong>Category:</strong> {selectedAuction.category}</p>
                  <p><strong>Status:</strong> {selectedAuction.status}</p>
                  <p><strong>Featured:</strong> {selectedAuction.featured ? 'Yes' : 'No'}</p>
                  <p><strong>Reported:</strong> {selectedAuction.reported ? 'Yes' : 'No'}</p>
                </div>

                <div className="detail-section">
                  <h3>Seller Information</h3>
                  <p><strong>Name:</strong> {selectedAuction.seller.firstName} {selectedAuction.seller.lastName}</p>
                  <p><strong>Email:</strong> {selectedAuction.seller.email}</p>
                </div>

                <div className="detail-section">
                  <h3>Pricing & Bids</h3>
                  <p><strong>Starting Price:</strong> ${selectedAuction.startingPrice}</p>
                  <p><strong>Current Bid:</strong> ${selectedAuction.currentBid}</p>
                  <p><strong>Total Bids:</strong> {selectedAuction.totalBids}</p>
                </div>

                <div className="detail-section">
                  <h3>Timing</h3>
                  <p><strong>Start Time:</strong> {new Date(selectedAuction.startTime).toLocaleString()}</p>
                  <p><strong>End Time:</strong> {new Date(selectedAuction.endTime).toLocaleString()}</p>
                  <p><strong>Time Remaining:</strong> {getTimeRemaining(selectedAuction.endTime)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuctionManagement;
