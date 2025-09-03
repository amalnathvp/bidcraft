import React, { useState, useEffect } from 'react';

interface AdminAnalyticsProps {
  onNavigate: (page: string, data?: any) => void;
}

interface AnalyticsData {
  userGrowth: number[];
  revenueData: number[];
  auctionData: number[];
  topCategories: { name: string; count: number; revenue: number }[];
  userActivity: { day: string; users: number }[];
  conversionRate: number;
  avgTransactionValue: number;
}

const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ onNavigate }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    userGrowth: [120, 132, 145, 158, 172, 189, 205, 223, 241, 258, 275, 294],
    revenueData: [12500, 13200, 14800, 16200, 18500, 21000, 23800, 26500, 29200, 31800, 34500, 37200],
    auctionData: [85, 92, 98, 105, 112, 118, 125, 132, 138, 145, 152, 159],
    topCategories: [
      { name: 'Electronics', count: 245, revenue: 125000 },
      { name: 'Art & Collectibles', count: 189, revenue: 98500 },
      { name: 'Fashion', count: 156, revenue: 67200 },
      { name: 'Home & Garden', count: 134, revenue: 45800 },
      { name: 'Sports', count: 98, revenue: 32400 }
    ],
    userActivity: [
      { day: 'Mon', users: 340 },
      { day: 'Tue', users: 380 },
      { day: 'Wed', users: 420 },
      { day: 'Thu', users: 395 },
      { day: 'Fri', users: 450 },
      { day: 'Sat', users: 320 },
      { day: 'Sun', users: 290 }
    ],
    conversionRate: 3.4,
    avgTransactionValue: 185.50
  });

  const timeRanges = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' }
  ];

  const SimpleChart: React.FC<{ data: number[]; color: string; height?: number }> = ({ 
    data, color, height = 100 
  }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min;
    
    return (
      <div style={{ height: `${height}px`, display: 'flex', alignItems: 'end', gap: '2px' }}>
        {data.map((value, index) => (
          <div
            key={index}
            style={{
              flex: 1,
              backgroundColor: color,
              height: `${range === 0 ? 50 : ((value - min) / range) * 100}%`,
              borderRadius: '2px 2px 0 0',
              transition: 'all 0.3s ease',
              opacity: 0.8
            }}
          />
        ))}
      </div>
    );
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
                  📊 Dashboard Analytics
                </h1>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '0' }}>
                  Comprehensive insights and performance metrics
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {timeRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value as any)}
                  style={{
                    background: timeRange === range.value ? 'white' : 'rgba(255, 255, 255, 0.2)',
                    color: timeRange === range.value ? '#667eea' : 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '15px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Key Metrics */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px', 
          marginBottom: '40px' 
        }}>
          {[
            { title: 'Total Revenue', value: '$285,420', change: '+12.5%', icon: '💰', color: '#4CAF50' },
            { title: 'Conversion Rate', value: `${analytics.conversionRate}%`, change: '+0.8%', icon: '📈', color: '#2196F3' },
            { title: 'Avg Transaction', value: `$${analytics.avgTransactionValue}`, change: '+5.2%', icon: '💳', color: '#FF9800' },
            { title: 'Active Users', value: '1,247', change: '+18.7%', icon: '👥', color: '#9C27B0' }
          ].map((metric, index) => (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '15px',
              padding: '25px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ fontSize: '32px' }}>{metric.icon}</span>
                <span style={{ 
                  color: '#4CAF50', 
                  fontSize: '12px', 
                  fontWeight: 'bold',
                  background: 'rgba(76, 175, 80, 0.1)',
                  padding: '4px 8px',
                  borderRadius: '10px'
                }}>
                  {metric.change}
                </span>
              </div>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 'bold', color: metric.color }}>
                {metric.value}
              </h3>
              <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>{metric.title}</p>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
          {/* Revenue Trend */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px', fontWeight: 'bold' }}>
              📈 Revenue Trend ({timeRange})
            </h3>
            <SimpleChart data={analytics.revenueData} color="#4CAF50" height={150} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', fontSize: '12px', color: '#666' }}>
              <span>Start</span>
              <span>Current: ${analytics.revenueData[analytics.revenueData.length - 1].toLocaleString()}</span>
              <span>End</span>
            </div>
          </div>

          {/* User Growth */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px', fontWeight: 'bold' }}>
              👥 User Growth ({timeRange})
            </h3>
            <SimpleChart data={analytics.userGrowth} color="#2196F3" height={150} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', fontSize: '12px', color: '#666' }}>
              <span>Start</span>
              <span>Current: {analytics.userGrowth[analytics.userGrowth.length - 1]} users</span>
              <span>End</span>
            </div>
          </div>
        </div>

        {/* Detailed Analytics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          {/* Top Categories */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '18px', fontWeight: 'bold' }}>
              🏆 Top Performing Categories
            </h3>
            {analytics.topCategories.map((category, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '15px 0',
                borderBottom: index < analytics.topCategories.length - 1 ? '1px solid #eee' : 'none'
              }}>
                <div>
                  <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#333' }}>{category.name}</p>
                  <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>{category.count} auctions</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0', fontWeight: 'bold', color: '#4CAF50' }}>
                    ${category.revenue.toLocaleString()}
                  </p>
                  <div style={{
                    width: `${(category.revenue / 125000) * 100}px`,
                    height: '4px',
                    backgroundColor: '#4CAF50',
                    borderRadius: '2px',
                    marginTop: '5px'
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Weekly Activity */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '18px', fontWeight: 'bold' }}>
              📅 Weekly User Activity
            </h3>
            <div style={{ display: 'flex', alignItems: 'end', gap: '15px', height: '150px' }}>
              {analytics.userActivity.map((day, index) => (
                <div key={index} style={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  height: '100%'
                }}>
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'end',
                    marginBottom: '10px'
                  }}>
                    <div style={{
                      width: '100%',
                      height: `${(day.users / 450) * 100}%`,
                      backgroundColor: '#9C27B0',
                      borderRadius: '4px 4px 0 0',
                      minHeight: '20px'
                    }} />
                  </div>
                  <p style={{ margin: '0', fontSize: '12px', color: '#666', fontWeight: 'bold' }}>
                    {day.day}
                  </p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '11px', color: '#9C27B0', fontWeight: 'bold' }}>
                    {day.users}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
