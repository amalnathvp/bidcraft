import React, { useState } from 'react';

interface AdminModerationProps {
  onNavigate: (page: string, data?: any) => void;
}

interface PendingListing {
  id: string;
  title: string;
  seller: string;
  category: string;
  startingPrice: number;
  description: string;
  images: string[];
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  flaggedReason?: string;
}

const AdminModeration: React.FC<AdminModerationProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'reports'>('pending');
  const [selectedListing, setSelectedListing] = useState<PendingListing | null>(null);
  
  const [pendingListings, setPendingListings] = useState<PendingListing[]>([
    {
      id: '1',
      title: 'Vintage Rolex Submariner Watch',
      seller: 'watchcollector@email.com',
      category: 'Watches & Jewelry',
      startingPrice: 5000,
      description: 'Authentic vintage Rolex Submariner from 1985. Excellent condition, recently serviced.',
      images: ['image1.jpg', 'image2.jpg'],
      submittedAt: '2025-09-03 14:30:00',
      status: 'pending'
    },
    {
      id: '2',
      title: 'iPhone 15 Pro Max - Brand New',
      seller: 'techseller@email.com',
      category: 'Electronics',
      startingPrice: 800,
      description: 'Brand new iPhone 15 Pro Max, unopened box with all accessories.',
      images: ['iphone1.jpg', 'iphone2.jpg'],
      submittedAt: '2025-09-03 13:15:00',
      status: 'pending',
      flaggedReason: 'Suspicious pricing - significantly below market value'
    },
    {
      id: '3',
      title: 'Original Van Gogh Painting',
      seller: 'artdealer@gallery.com',
      category: 'Art & Collectibles',
      startingPrice: 100000,
      description: 'Rare original Van Gogh painting with authentication certificate.',
      images: ['vangogh1.jpg'],
      submittedAt: '2025-09-03 12:45:00',
      status: 'pending',
      flaggedReason: 'Requires authentication verification'
    }
  ]);

  const approveListing = (listingId: string) => {
    setPendingListings(listings =>
      listings.map(listing =>
        listing.id === listingId ? { ...listing, status: 'approved' } : listing
      )
    );
    setSelectedListing(null);
  };

  const rejectListing = (listingId: string, reason: string) => {
    setPendingListings(listings =>
      listings.map(listing =>
        listing.id === listingId ? { ...listing, status: 'rejected', flaggedReason: reason } : listing
      )
    );
    setSelectedListing(null);
  };

  const getFilteredListings = () => {
    return pendingListings.filter(listing => {
      if (activeTab === 'pending') return listing.status === 'pending';
      if (activeTab === 'approved') return listing.status === 'approved';
      if (activeTab === 'rejected') return listing.status === 'rejected';
      return true;
    });
  };

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      minHeight: '100vh',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        padding: '20px 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <button
                onClick={() => onNavigate('admin-dashboard')}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  padding: '10px 15px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ← Back
              </button>
              <div>
                <h1 style={{ 
                  color: 'white', 
                  margin: '0 0 5px 0', 
                  fontSize: '28px', 
                  fontWeight: 'bold' 
                }}>
                  ✅ Content Moderation
                </h1>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '0' }}>
                  Review and approve auction listings and user content
                </p>
              </div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '25px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              📋 {pendingListings.filter(l => l.status === 'pending').length} Pending Reviews
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Summary Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px', 
          marginBottom: '40px' 
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
            <h3 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
              {pendingListings.filter(l => l.status === 'pending').length}
            </h3>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Pending Review</p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>✅</div>
            <h3 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
              {pendingListings.filter(l => l.status === 'approved').length}
            </h3>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Approved Today</p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>❌</div>
            <h3 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#f44336' }}>
              {pendingListings.filter(l => l.status === 'rejected').length}
            </h3>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Rejected</p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🚩</div>
            <h3 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#9C27B0' }}>
              {pendingListings.filter(l => l.flaggedReason).length}
            </h3>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Flagged Items</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { key: 'pending', label: 'Pending Review', icon: '⏳', count: pendingListings.filter(l => l.status === 'pending').length },
              { key: 'approved', label: 'Approved', icon: '✅', count: pendingListings.filter(l => l.status === 'approved').length },
              { key: 'rejected', label: 'Rejected', icon: '❌', count: pendingListings.filter(l => l.status === 'rejected').length },
              { key: 'reports', label: 'User Reports', icon: '🚩', count: 5 }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  background: activeTab === tab.key ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.2)',
                  color: activeTab === tab.key ? '#667eea' : 'white',
                  border: 'none',
                  padding: '15px 25px',
                  borderRadius: '15px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
                <span style={{
                  background: activeTab === tab.key ? '#667eea' : 'rgba(255, 255, 255, 0.3)',
                  color: activeTab === tab.key ? 'white' : 'white',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  minWidth: '20px',
                  textAlign: 'center'
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          {activeTab !== 'reports' ? (
            <div>
              <h3 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '20px', fontWeight: 'bold' }}>
                {activeTab === 'pending' && 'Listings Awaiting Review'}
                {activeTab === 'approved' && 'Recently Approved Listings'}
                {activeTab === 'rejected' && 'Rejected Listings'}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {getFilteredListings().map((listing) => (
                  <div key={listing.id} style={{
                    border: listing.flaggedReason ? '2px solid #FF9800' : '1px solid #e9ecef',
                    borderRadius: '15px',
                    padding: '25px',
                    background: '#f8f9fa'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                          <h4 style={{ margin: '0', color: '#333', fontSize: '18px', fontWeight: 'bold' }}>
                            {listing.title}
                          </h4>
                          {listing.flaggedReason && (
                            <span style={{
                              background: '#FF9800',
                              color: 'white',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              🚩 FLAGGED
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                          <div>
                            <strong>Seller:</strong> {listing.seller}
                          </div>
                          <div>
                            <strong>Category:</strong> {listing.category}
                          </div>
                          <div>
                            <strong>Starting Price:</strong> ${listing.startingPrice.toLocaleString()}
                          </div>
                          <div>
                            <strong>Submitted:</strong> {new Date(listing.submittedAt).toLocaleDateString()}
                          </div>
                        </div>

                        <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px', lineHeight: '1.5' }}>
                          {listing.description}
                        </p>

                        {listing.flaggedReason && (
                          <div style={{
                            background: '#fff3cd',
                            border: '1px solid #ffeaa7',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '15px'
                          }}>
                            <strong style={{ color: '#856404' }}>⚠️ Flag Reason:</strong>
                            <p style={{ margin: '5px 0 0 0', color: '#856404', fontSize: '14px' }}>
                              {listing.flaggedReason}
                            </p>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}>
                        <button
                          onClick={() => setSelectedListing(listing)}
                          style={{
                            background: '#2196F3',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        >
                          🔍 Review Details
                        </button>

                        {listing.status === 'pending' && (
                          <>
                            <button
                              onClick={() => approveListing(listing.id)}
                              style={{
                                background: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                              }}
                            >
                              ✅ Approve
                            </button>
                            <button
                              onClick={() => rejectListing(listing.id, 'Content policy violation')}
                              style={{
                                background: '#f44336',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                              }}
                            >
                              ❌ Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h3 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '20px', fontWeight: 'bold' }}>
                User Reports & Content Violations
              </h3>
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>📝</div>
                <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>No Active Reports</h4>
                <p style={{ margin: '0' }}>All user reports have been reviewed and resolved.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedListing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            width: '600px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h3 style={{ margin: '0', color: '#333' }}>Review Listing Details</h3>
              <button
                onClick={() => setSelectedListing(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            <div>
              <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>{selectedListing.title}</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <strong>Seller:</strong> {selectedListing.seller}
                </div>
                <div>
                  <strong>Category:</strong> {selectedListing.category}
                </div>
                <div>
                  <strong>Starting Price:</strong> ${selectedListing.startingPrice.toLocaleString()}
                </div>
                <div>
                  <strong>Submitted:</strong> {new Date(selectedListing.submittedAt).toLocaleDateString()}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <strong>Description:</strong>
                <p style={{ margin: '10px 0', color: '#666', lineHeight: '1.5' }}>
                  {selectedListing.description}
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <strong>Images:</strong>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  {selectedListing.images.map((image, index) => (
                    <div
                      key={index}
                      style={{
                        width: '80px',
                        height: '80px',
                        background: '#f0f0f0',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: '#666'
                      }}
                    >
                      Image {index + 1}
                    </div>
                  ))}
                </div>
              </div>

              {selectedListing.flaggedReason && (
                <div style={{
                  background: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '25px'
                }}>
                  <strong style={{ color: '#856404' }}>⚠️ Flag Reason:</strong>
                  <p style={{ margin: '10px 0 0 0', color: '#856404' }}>
                    {selectedListing.flaggedReason}
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setSelectedListing(null)}
                  style={{
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Close
                </button>
                {selectedListing.status === 'pending' && (
                  <>
                    <button
                      onClick={() => approveListing(selectedListing.id)}
                      style={{
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      ✅ Approve Listing
                    </button>
                    <button
                      onClick={() => rejectListing(selectedListing.id, 'Content policy violation')}
                      style={{
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      ❌ Reject Listing
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminModeration;
