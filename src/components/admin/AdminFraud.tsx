import React, { useState } from 'react';

interface AdminFraudProps {
  onNavigate: (page: string, data?: any) => void;
}

interface FraudAlert {
  id: string;
  type: 'suspicious_bidding' | 'fake_profile' | 'payment_fraud' | 'listing_manipulation' | 'account_takeover';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  userEmail: string;
  description: string;
  timestamp: string;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  details: any;
}

interface SecurityMetrics {
  totalAlerts: number;
  activeInvestigations: number;
  resolvedToday: number;
  falsePositiveRate: number;
  blockedAccounts: number;
  suspiciousTransactions: number;
}

const AdminFraud: React.FC<AdminFraudProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'investigations' | 'patterns' | 'settings'>('alerts');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('open');

  const [metrics] = useState<SecurityMetrics>({
    totalAlerts: 47,
    activeInvestigations: 8,
    resolvedToday: 12,
    falsePositiveRate: 15.2,
    blockedAccounts: 23,
    suspiciousTransactions: 156
  });

  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([
    {
      id: '1',
      type: 'suspicious_bidding',
      severity: 'high',
      userId: 'user_12345',
      userEmail: 'suspicious@email.com',
      description: 'Multiple rapid bids from same IP address across different accounts',
      timestamp: '2025-09-03 14:30:22',
      status: 'open',
      details: {
        ipAddress: '192.168.1.100',
        accountsInvolved: 3,
        bidsInLastHour: 47,
        totalValue: 15420
      }
    },
    {
      id: '2',
      type: 'fake_profile',
      severity: 'medium',
      userId: 'user_67890',
      userEmail: 'fake.profile@temp.com',
      description: 'Profile created with stock photo and minimal verification',
      timestamp: '2025-09-03 13:15:10',
      status: 'investigating',
      details: {
        profileAge: '2 hours',
        verificationStatus: 'none',
        profilePicture: 'stock_photo_detected',
        activityPattern: 'highly_active'
      }
    },
    {
      id: '3',
      type: 'payment_fraud',
      severity: 'critical',
      userId: 'user_11111',
      userEmail: 'fraudulent@payment.com',
      description: 'Chargeback initiated on completed transaction',
      timestamp: '2025-09-03 12:45:33',
      status: 'open',
      details: {
        transactionAmount: 2850,
        paymentMethod: 'stolen_card_suspected',
        chargebackReason: 'unauthorized_transaction',
        merchantLoss: 2850
      }
    },
    {
      id: '4',
      type: 'listing_manipulation',
      severity: 'medium',
      userId: 'user_22222',
      userEmail: 'manipulator@auctions.com',
      description: 'Seller artificially inflating bid prices with fake accounts',
      timestamp: '2025-09-03 11:20:15',
      status: 'resolved',
      details: {
        auctionId: 'auction_456',
        fakeBids: 12,
        priceInflation: '40%',
        accountsSuspended: 2
      }
    }
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#f44336';
      case 'critical': return '#9C27B0';
      default: return '#666';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#f44336';
      case 'investigating': return '#FF9800';
      case 'resolved': return '#4CAF50';
      case 'false_positive': return '#666';
      default: return '#666';
    }
  };

  const updateAlertStatus = (alertId: string, newStatus: string) => {
    setFraudAlerts(alerts =>
      alerts.map(alert =>
        alert.id === alertId ? { ...alert, status: newStatus as any } : alert
      )
    );
  };

  const filteredAlerts = fraudAlerts.filter(alert => {
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && alert.status !== filterStatus) return false;
    return true;
  });

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
                  🛡️ Fraud Detection & Security
                </h1>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '0' }}>
                  Monitor suspicious activities and protect platform integrity
                </p>
              </div>
            </div>
            <div style={{
              background: metrics.totalAlerts > 0 ? 'rgba(244, 67, 54, 0.2)' : 'rgba(76, 175, 80, 0.2)',
              border: `1px solid ${metrics.totalAlerts > 0 ? 'rgba(244, 67, 54, 0.5)' : 'rgba(76, 175, 80, 0.5)'}`,
              color: 'white',
              padding: '12px 20px',
              borderRadius: '25px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              🚨 {metrics.totalAlerts} Active Alerts
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Security Metrics */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '20px', 
          marginBottom: '40px' 
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🚨</div>
            <h3 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#f44336' }}>
              {metrics.totalAlerts}
            </h3>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Total Alerts</p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔍</div>
            <h3 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
              {metrics.activeInvestigations}
            </h3>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Investigating</p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>✅</div>
            <h3 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
              {metrics.resolvedToday}
            </h3>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Resolved Today</p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🚫</div>
            <h3 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#9C27B0' }}>
              {metrics.blockedAccounts}
            </h3>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Blocked Accounts</p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>💳</div>
            <h3 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#f44336' }}>
              {metrics.suspiciousTransactions}
            </h3>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Suspicious Transactions</p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>📊</div>
            <h3 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
              {metrics.falsePositiveRate}%
            </h3>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>False Positive Rate</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { key: 'alerts', label: 'Active Alerts', icon: '🚨' },
              { key: 'investigations', label: 'Investigations', icon: '🔍' },
              { key: 'patterns', label: 'Fraud Patterns', icon: '📊' },
              { key: 'settings', label: 'Detection Settings', icon: '⚙️' }
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
          {activeTab === 'alerts' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h3 style={{ margin: '0', color: '#333', fontSize: '20px', fontWeight: 'bold' }}>
                  Fraud Alerts
                </h3>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <select
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="all">All Severities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                    <option value="false_positive">False Positive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {filteredAlerts.map((alert) => (
                  <div key={alert.id} style={{
                    border: `2px solid ${getSeverityColor(alert.severity)}`,
                    borderRadius: '15px',
                    padding: '25px',
                    background: '#f8f9fa'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                          <span style={{
                            background: getSeverityColor(alert.severity),
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                          }}>
                            {alert.severity} {alert.type.replace('_', ' ')}
                          </span>
                          <span style={{
                            background: getStatusColor(alert.status),
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            {alert.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '16px', fontWeight: 'bold' }}>
                          User: {alert.userEmail}
                        </h4>
                        <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px', lineHeight: '1.5' }}>
                          {alert.description}
                        </p>
                        <p style={{ margin: '0', color: '#999', fontSize: '12px' }}>
                          Detected: {alert.timestamp}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {alert.status === 'open' && (
                          <button
                            onClick={() => updateAlertStatus(alert.id, 'investigating')}
                            style={{
                              background: '#FF9800',
                              color: 'white',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          >
                            🔍 Investigate
                          </button>
                        )}
                        {alert.status === 'investigating' && (
                          <>
                            <button
                              onClick={() => updateAlertStatus(alert.id, 'resolved')}
                              style={{
                                background: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}
                            >
                              ✅ Resolve
                            </button>
                            <button
                              onClick={() => updateAlertStatus(alert.id, 'false_positive')}
                              style={{
                                background: '#666',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}
                            >
                              ❌ False Positive
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Alert Details */}
                    <div style={{ 
                      background: 'white', 
                      padding: '15px', 
                      borderRadius: '10px',
                      border: '1px solid #e9ecef'
                    }}>
                      <h5 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '14px', fontWeight: 'bold' }}>
                        Detection Details:
                      </h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', fontSize: '12px' }}>
                        {Object.entries(alert.details).map(([key, value]) => (
                          <div key={key}>
                            <strong>{key.replace('_', ' ')}:</strong> {String(value)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'patterns' && (
            <div>
              <h3 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '20px', fontWeight: 'bold' }}>
                Fraud Pattern Analysis
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                <div style={{ background: '#f8f9fa', padding: '25px', borderRadius: '15px' }}>
                  <h4 style={{ margin: '0 0 20px 0', color: '#333' }}>Most Common Fraud Types</h4>
                  {[
                    { type: 'Suspicious Bidding', count: 18, percentage: 38 },
                    { type: 'Fake Profiles', count: 12, percentage: 26 },
                    { type: 'Payment Fraud', count: 9, percentage: 19 },
                    { type: 'Listing Manipulation', count: 5, percentage: 11 },
                    { type: 'Account Takeover', count: 3, percentage: 6 }
                  ].map((pattern, index) => (
                    <div key={index} style={{ marginBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '14px', color: '#333' }}>{pattern.type}</span>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#f44336' }}>
                          {pattern.count} cases
                        </span>
                      </div>
                      <div style={{ 
                        width: '100%', 
                        height: '8px', 
                        background: '#e9ecef', 
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${pattern.percentage}%`,
                          height: '100%',
                          background: '#f44336',
                          borderRadius: '4px'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#f8f9fa', padding: '25px', borderRadius: '15px' }}>
                  <h4 style={{ margin: '0 0 20px 0', color: '#333' }}>Detection Effectiveness</h4>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      background: `conic-gradient(#4CAF50 0deg ${84.8 * 3.6}deg, #e9ecef ${84.8 * 3.6}deg 360deg)`,
                      margin: '0 auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#333',
                      fontWeight: 'bold',
                      fontSize: '18px'
                    }}>
                      84.8%
                    </div>
                    <p style={{ margin: '10px 0 0 0', color: '#666', fontSize: '14px' }}>
                      Detection Accuracy
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>True Positives:</span>
                      <strong style={{ color: '#4CAF50' }}>40</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>False Positives:</span>
                      <strong style={{ color: '#f44336' }}>7</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Cases Reviewed:</span>
                      <strong>47</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h3 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '20px', fontWeight: 'bold' }}>
                Fraud Detection Settings
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                <div style={{ background: '#f8f9fa', padding: '25px', borderRadius: '15px' }}>
                  <h4 style={{ margin: '0 0 20px 0', color: '#333' }}>Detection Sensitivity</h4>
                  {[
                    { setting: 'Suspicious Bidding', level: 'High', enabled: true },
                    { setting: 'Fake Profile Detection', level: 'Medium', enabled: true },
                    { setting: 'Payment Anomalies', level: 'High', enabled: true },
                    { setting: 'IP Tracking', level: 'Medium', enabled: true },
                    { setting: 'Device Fingerprinting', level: 'Low', enabled: false }
                  ].map((setting, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: index < 4 ? '1px solid #e9ecef' : 'none'
                    }}>
                      <div>
                        <div style={{ fontWeight: '500', color: '#333' }}>{setting.setting}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Sensitivity: {setting.level}</div>
                      </div>
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
                  <h4 style={{ margin: '0 0 20px 0', color: '#333' }}>Automated Actions</h4>
                  {[
                    { action: 'Auto-suspend high-risk accounts', enabled: true },
                    { action: 'Block suspicious IP addresses', enabled: true },
                    { action: 'Flag unusual bidding patterns', enabled: true },
                    { action: 'Require additional verification', enabled: false },
                    { action: 'Auto-refund fraud victims', enabled: false }
                  ].map((action, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: index < 4 ? '1px solid #e9ecef' : 'none'
                    }}>
                      <div style={{ fontWeight: '500', color: '#333' }}>{action.action}</div>
                      <div style={{
                        width: '50px',
                        height: '25px',
                        borderRadius: '12px',
                        background: action.enabled ? '#4CAF50' : '#ccc',
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
                          left: action.enabled ? '27px' : '2px',
                          transition: 'all 0.3s ease'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminFraud;
