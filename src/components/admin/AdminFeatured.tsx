import React, { useState } from 'react';

interface AdminFeaturedProps {
  onNavigate: (page: string, data?: any) => void;
}

interface FeaturedAuction {
  id: string;
  title: string;
  seller: string;
  currentBid: number;
  startingPrice: number;
  category: string;
  endTime: string;
  status: 'active' | 'expired' | 'scheduled';
  featuredType: 'premium' | 'sponsored' | 'homepage';
  paymentAmount: number;
  duration: number; // days
  impressions: number;
  clicks: number;
  bids: number;
}

interface PromotionPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  features: string[];
  popular?: boolean;
}

const AdminFeatured: React.FC<AdminFeaturedProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'current' | 'packages' | 'analytics' | 'settings'>('current');
  const [showAddPackage, setShowAddPackage] = useState(false);

  const [featuredAuctions, setFeaturedAuctions] = useState<FeaturedAuction[]>([
    {
      id: '1',
      title: 'Rare Vintage Watch Collection',
      seller: 'watchcollector@premium.com',
      currentBid: 15420,
      startingPrice: 5000,
      category: 'Watches & Jewelry',
      endTime: '2025-09-10 18:00:00',
      status: 'active',
      featuredType: 'premium',
      paymentAmount: 299,
      duration: 14,
      impressions: 45230,
      clicks: 1820,
      bids: 47
    },
    {
      id: '2',
      title: 'Original Artwork by Local Artist',
      seller: 'artgallery@creative.com',
      currentBid: 2850,
      startingPrice: 800,
      category: 'Art & Collectibles',
      endTime: '2025-09-08 20:00:00',
      status: 'active',
      featuredType: 'homepage',
      paymentAmount: 149,
      duration: 7,
      impressions: 28950,
      clicks: 980,
      bids: 23
    },
    {
      id: '3',
      title: 'Gaming PC Setup Complete',
      seller: 'techseller@gaming.com',
      currentBid: 3200,
      startingPrice: 2000,
      category: 'Electronics',
      endTime: '2025-09-05 15:30:00',
      status: 'expired',
      featuredType: 'sponsored',
      paymentAmount: 99,
      duration: 5,
      impressions: 18750,
      clicks: 650,
      bids: 31
    }
  ]);

  const [promotionPackages] = useState<PromotionPackage[]>([
    {
      id: '1',
      name: 'Premium Spotlight',
      description: 'Featured on homepage hero section with priority placement',
      price: 299,
      duration: 14,
      features: ['Homepage hero placement', 'Search result priority', 'Email newsletter inclusion', 'Social media promotion', 'Featured badge'],
      popular: true
    },
    {
      id: '2',
      name: 'Homepage Feature',
      description: 'Displayed in featured auctions section on homepage',
      price: 149,
      duration: 7,
      features: ['Featured section placement', 'Category page priority', 'Featured badge', 'Email inclusion']
    },
    {
      id: '3',
      name: 'Sponsored Listing',
      description: 'Enhanced visibility in search results and category pages',
      price: 99,
      duration: 5,
      features: ['Search result boost', 'Category priority', 'Sponsored badge']
    },
    {
      id: '4',
      name: 'Quick Boost',
      description: 'Short-term visibility boost for last-minute promotion',
      price: 49,
      duration: 3,
      features: ['Search visibility boost', 'Quick promotion badge']
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'expired': return '#666';
      case 'scheduled': return '#2196F3';
      default: return '#666';
    }
  };

  const getFeatureTypeColor = (type: string) => {
    switch (type) {
      case 'premium': return '#9C27B0';
      case 'homepage': return '#FF9800';
      case 'sponsored': return '#2196F3';
      default: return '#666';
    }
  };

  const totalRevenue = featuredAuctions.reduce((sum, auction) => sum + auction.paymentAmount, 0);
  const activePromotions = featuredAuctions.filter(a => a.status === 'active').length;
  const totalImpressions = featuredAuctions.reduce((sum, auction) => sum + auction.impressions, 0);
  const avgCTR = featuredAuctions.length > 0 
    ? (featuredAuctions.reduce((sum, auction) => sum + (auction.clicks / auction.impressions), 0) / featuredAuctions.length * 100).toFixed(2)
    : 0;

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
                  🌟 Featured Auctions & Promotions
                </h1>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '0' }}>
                  Manage paid promotions and featured auction listings
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddPackage(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '25px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              + New Package
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Revenue Cards */}
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
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>💰</div>
            <h3 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
              ${totalRevenue.toLocaleString()}
            </h3>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Total Revenue</p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎯</div>
            <h3 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
              {activePromotions}
            </h3>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Active Promotions</p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>👁️</div>
            <h3 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
              {(totalImpressions / 1000).toFixed(1)}K
            </h3>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Total Impressions</p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>📈</div>
            <h3 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#9C27B0' }}>
              {avgCTR}%
            </h3>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Avg Click Rate</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { key: 'current', label: 'Current Promotions', icon: '🎯' },
              { key: 'packages', label: 'Promotion Packages', icon: '📦' },
              { key: 'analytics', label: 'Performance Analytics', icon: '📊' },
              { key: 'settings', label: 'Settings', icon: '⚙️' }
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
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          {activeTab === 'current' && (
            <div>
              <h3 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '20px', fontWeight: 'bold' }}>
                Current Featured Auctions
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {featuredAuctions.map((auction) => (
                  <div key={auction.id} style={{
                    border: '1px solid #e9ecef',
                    borderRadius: '15px',
                    padding: '25px',
                    background: '#f8f9fa'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                          <h4 style={{ margin: '0', color: '#333', fontSize: '18px', fontWeight: 'bold' }}>
                            {auction.title}
                          </h4>
                          <span style={{
                            background: getStatusColor(auction.status),
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                          }}>
                            {auction.status}
                          </span>
                          <span style={{
                            background: getFeatureTypeColor(auction.featuredType),
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                          }}>
                            {auction.featuredType}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                          <div>
                            <strong>Seller:</strong> {auction.seller}
                          </div>
                          <div>
                            <strong>Current Bid:</strong> ${auction.currentBid.toLocaleString()}
                          </div>
                          <div>
                            <strong>Category:</strong> {auction.category}
                          </div>
                          <div>
                            <strong>End Time:</strong> {new Date(auction.endTime).toLocaleDateString()}
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px' }}>
                          <div>
                            <span style={{ fontSize: '12px', color: '#666' }}>Payment</span>
                            <div style={{ fontWeight: 'bold', color: '#4CAF50' }}>${auction.paymentAmount}</div>
                          </div>
                          <div>
                            <span style={{ fontSize: '12px', color: '#666' }}>Duration</span>
                            <div style={{ fontWeight: 'bold' }}>{auction.duration} days</div>
                          </div>
                          <div>
                            <span style={{ fontSize: '12px', color: '#666' }}>Impressions</span>
                            <div style={{ fontWeight: 'bold', color: '#FF9800' }}>{auction.impressions.toLocaleString()}</div>
                          </div>
                          <div>
                            <span style={{ fontSize: '12px', color: '#666' }}>Clicks</span>
                            <div style={{ fontWeight: 'bold', color: '#2196F3' }}>{auction.clicks}</div>
                          </div>
                          <div>
                            <span style={{ fontSize: '12px', color: '#666' }}>CTR</span>
                            <div style={{ fontWeight: 'bold', color: '#9C27B0' }}>
                              {((auction.clicks / auction.impressions) * 100).toFixed(2)}%
                            </div>
                          </div>
                          <div>
                            <span style={{ fontSize: '12px', color: '#666' }}>Bids</span>
                            <div style={{ fontWeight: 'bold', color: '#f44336' }}>{auction.bids}</div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}>
                        <button
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
                          📊 View Details
                        </button>
                        {auction.status === 'active' && (
                          <button
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
                            🛑 End Promotion
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'packages' && (
            <div>
              <h3 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '20px', fontWeight: 'bold' }}>
                Promotion Packages
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
                {promotionPackages.map((pkg) => (
                  <div key={pkg.id} style={{
                    border: pkg.popular ? '2px solid #4CAF50' : '1px solid #e9ecef',
                    borderRadius: '15px',
                    padding: '25px',
                    background: 'white',
                    position: 'relative'
                  }}>
                    {pkg.popular && (
                      <div style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#4CAF50',
                        color: 'white',
                        padding: '6px 20px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        MOST POPULAR
                      </div>
                    )}

                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '20px', fontWeight: 'bold' }}>
                        {pkg.name}
                      </h4>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4CAF50', marginBottom: '5px' }}>
                        ${pkg.price}
                      </div>
                      <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                        {pkg.duration} days promotion
                      </p>
                    </div>

                    <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '14px', textAlign: 'center', lineHeight: '1.5' }}>
                      {pkg.description}
                    </p>

                    <div style={{ marginBottom: '25px' }}>
                      <h5 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '14px', fontWeight: 'bold' }}>
                        Features included:
                      </h5>
                      <ul style={{ margin: '0', padding: '0', listStyle: 'none' }}>
                        {pkg.features.map((feature, index) => (
                          <li key={index} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            marginBottom: '8px',
                            fontSize: '14px',
                            color: '#666'
                          }}>
                            <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>✓</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      style={{
                        width: '100%',
                        background: pkg.popular ? '#4CAF50' : '#2196F3',
                        color: 'white',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      Edit Package
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h3 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '20px', fontWeight: 'bold' }}>
                Promotion Performance Analytics
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                <div style={{ background: '#f8f9fa', padding: '25px', borderRadius: '15px' }}>
                  <h4 style={{ margin: '0 0 20px 0', color: '#333' }}>Revenue by Package Type</h4>
                  {[
                    { type: 'Premium Spotlight', revenue: 897, count: 3, color: '#9C27B0' },
                    { type: 'Homepage Feature', revenue: 596, count: 4, color: '#FF9800' },
                    { type: 'Sponsored Listing', revenue: 396, count: 4, color: '#2196F3' },
                    { type: 'Quick Boost', revenue: 147, count: 3, color: '#4CAF50' }
                  ].map((item, index) => (
                    <div key={index} style={{ marginBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>{item.type}</span>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '14px', fontWeight: 'bold', color: item.color }}>
                            ${item.revenue}
                          </span>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {item.count} promotions
                          </div>
                        </div>
                      </div>
                      <div style={{ 
                        width: '100%', 
                        height: '8px', 
                        background: '#e9ecef', 
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${(item.revenue / 897) * 100}%`,
                          height: '100%',
                          background: item.color,
                          borderRadius: '4px'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#f8f9fa', padding: '25px', borderRadius: '15px' }}>
                  <h4 style={{ margin: '0 0 20px 0', color: '#333' }}>Performance Metrics</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4CAF50' }}>
                        {avgCTR}%
                      </div>
                      <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
                        Average Click-Through Rate
                      </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '10px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2196F3' }}>
                          {(featuredAuctions.reduce((sum, auction) => sum + auction.bids, 0) / featuredAuctions.length).toFixed(1)}
                        </div>
                        <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '12px' }}>
                          Avg Bids per Promotion
                        </p>
                      </div>
                      <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '10px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FF9800' }}>
                          ${(totalRevenue / featuredAuctions.length).toFixed(0)}
                        </div>
                        <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '12px' }}>
                          Avg Revenue per Promotion
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '10px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#9C27B0' }}>
                          8.7
                        </div>
                        <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '12px' }}>
                          Avg Duration (days)
                        </p>
                      </div>
                      <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '10px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f44336' }}>
                          92%
                        </div>
                        <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '12px' }}>
                          Completion Rate
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h3 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '20px', fontWeight: 'bold' }}>
                Promotion Settings
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                <div style={{ background: '#f8f9fa', padding: '25px', borderRadius: '15px' }}>
                  <h4 style={{ margin: '0 0 20px 0', color: '#333' }}>Auto-Approval Settings</h4>
                  {[
                    { setting: 'Auto-approve Premium packages', enabled: true },
                    { setting: 'Require manual review for new sellers', enabled: true },
                    { setting: 'Auto-extend successful promotions', enabled: false },
                    { setting: 'Send performance reports to sellers', enabled: true },
                    { setting: 'Allow package upgrades mid-promotion', enabled: true }
                  ].map((setting, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: index < 4 ? '1px solid #e9ecef' : 'none'
                    }}>
                      <span style={{ fontWeight: '500', color: '#333' }}>{setting.setting}</span>
                      <div style={{
                        width: '50px',
                        height: '25px',
                        borderRadius: '12px',
                        background: setting.enabled ? '#4CAF50' : '#ccc',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{
                          width: '21px',
                          height: '21px',
                          borderRadius: '50%',
                          background: 'white',
                          position: 'absolute',
                          top: '2px',
                          left: setting.enabled ? '27px' : '2px',
                          transition: 'all 0.3s ease'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#f8f9fa', padding: '25px', borderRadius: '15px' }}>
                  <h4 style={{ margin: '0 0 20px 0', color: '#333' }}>Pricing & Limits</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                        Maximum promotions per seller
                      </label>
                      <input
                        type="number"
                        defaultValue={5}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '6px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                        Minimum promotion duration (days)
                      </label>
                      <input
                        type="number"
                        defaultValue={3}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '6px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                        Commission rate on promotions (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        defaultValue={10.0}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '6px'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminFeatured;
