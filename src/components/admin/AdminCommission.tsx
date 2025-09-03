import React, { useState } from 'react';

interface AdminCommissionProps {
  onNavigate: (page: string, data?: any) => void;
}

interface CommissionRule {
  id: string;
  category: string;
  minValue: number;
  maxValue: number;
  rate: number;
  type: 'percentage' | 'flat';
  active: boolean;
}

interface PaymentRecord {
  id: string;
  seller: string;
  amount: number;
  commission: number;
  status: 'pending' | 'processed' | 'failed';
  date: string;
}

const AdminCommission: React.FC<AdminCommissionProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'payments' | 'analytics'>('rules');
  const [showAddRule, setShowAddRule] = useState(false);
  
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([
    { id: '1', category: 'Electronics', minValue: 0, maxValue: 1000, rate: 5.0, type: 'percentage', active: true },
    { id: '2', category: 'Electronics', minValue: 1000, maxValue: 5000, rate: 4.5, type: 'percentage', active: true },
    { id: '3', category: 'Electronics', minValue: 5000, maxValue: 999999, rate: 4.0, type: 'percentage', active: true },
    { id: '4', category: 'Art & Collectibles', minValue: 0, maxValue: 999999, rate: 6.0, type: 'percentage', active: true },
    { id: '5', category: 'Fashion', minValue: 0, maxValue: 500, rate: 7.0, type: 'percentage', active: true },
    { id: '6', category: 'Default', minValue: 0, maxValue: 999999, rate: 5.5, type: 'percentage', active: true }
  ]);

  const [payments, setPayments] = useState<PaymentRecord[]>([
    { id: '1', seller: 'john@example.com', amount: 1250.00, commission: 62.50, status: 'processed', date: '2025-09-01' },
    { id: '2', seller: 'mary@example.com', amount: 890.00, commission: 44.50, status: 'pending', date: '2025-09-02' },
    { id: '3', seller: 'alex@example.com', amount: 2300.00, commission: 103.50, status: 'processed', date: '2025-09-02' },
    { id: '4', seller: 'sarah@example.com', amount: 450.00, commission: 31.50, status: 'failed', date: '2025-09-03' }
  ]);

  const [newRule, setNewRule] = useState<Partial<CommissionRule>>({
    category: '',
    minValue: 0,
    maxValue: 999999,
    rate: 5.0,
    type: 'percentage',
    active: true
  });

  const totalCommissionEarned = 14271.50;
  const monthlyCommission = 3420.80;
  const avgCommissionRate = 5.2;
  const pendingPayments = payments.filter(p => p.status === 'pending').length;

  const handleAddRule = () => {
    if (newRule.category && newRule.rate) {
      const rule: CommissionRule = {
        id: Date.now().toString(),
        category: newRule.category || '',
        minValue: newRule.minValue || 0,
        maxValue: newRule.maxValue || 999999,
        rate: newRule.rate || 5.0,
        type: newRule.type || 'percentage',
        active: true
      };
      setCommissionRules([...commissionRules, rule]);
      setNewRule({
        category: '',
        minValue: 0,
        maxValue: 999999,
        rate: 5.0,
        type: 'percentage',
        active: true
      });
      setShowAddRule(false);
    }
  };

  const toggleRuleStatus = (id: string) => {
    setCommissionRules(rules => 
      rules.map(rule => 
        rule.id === id ? { ...rule, active: !rule.active } : rule
      )
    );
  };

  const processPayment = (id: string) => {
    setPayments(payments => 
      payments.map(payment => 
        payment.id === id ? { ...payment, status: 'processed' } : payment
      )
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
                  💰 Commission Management
                </h1>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '0' }}>
                  Manage platform fees, commission rates, and payments
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddRule(true)}
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
              + Add New Rule
            </button>
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
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>Total Commission</p>
                <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
                  ${totalCommissionEarned.toLocaleString()}
                </p>
              </div>
              <span style={{ fontSize: '32px' }}>💰</span>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>Monthly Commission</p>
                <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
                  ${monthlyCommission.toLocaleString()}
                </p>
              </div>
              <span style={{ fontSize: '32px' }}>📈</span>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>Avg Commission Rate</p>
                <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
                  {avgCommissionRate}%
                </p>
              </div>
              <span style={{ fontSize: '32px' }}>📊</span>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>Pending Payments</p>
                <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#F44336' }}>
                  {pendingPayments}
                </p>
              </div>
              <span style={{ fontSize: '32px' }}>⏳</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { key: 'rules', label: 'Commission Rules', icon: '⚙️' },
              { key: 'payments', label: 'Payment Processing', icon: '💳' },
              { key: 'analytics', label: 'Commission Analytics', icon: '📊' }
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
          {activeTab === 'rules' && (
            <div>
              <h3 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '20px', fontWeight: 'bold' }}>
                Commission Rules by Category
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>Category</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>Min Value</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>Max Value</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>Rate</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>Type</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>Status</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissionRules.map((rule) => (
                      <tr key={rule.id}>
                        <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef' }}>
                          <strong>{rule.category}</strong>
                        </td>
                        <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef' }}>
                          ${rule.minValue.toLocaleString()}
                        </td>
                        <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef' }}>
                          ${rule.maxValue === 999999 ? '∞' : rule.maxValue.toLocaleString()}
                        </td>
                        <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef' }}>
                          <strong style={{ color: '#4CAF50' }}>{rule.rate}%</strong>
                        </td>
                        <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef' }}>
                          {rule.type}
                        </td>
                        <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            background: rule.active ? '#e8f5e8' : '#fee',
                            color: rule.active ? '#4CAF50' : '#f44336'
                          }}>
                            {rule.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef' }}>
                          <button
                            onClick={() => toggleRuleStatus(rule.id)}
                            style={{
                              background: rule.active ? '#f44336' : '#4CAF50',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            {rule.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              <h3 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '20px', fontWeight: 'bold' }}>
                Recent Commission Payments
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>Seller</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>Sale Amount</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>Commission</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>Date</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>Status</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef' }}>
                          {payment.seller}
                        </td>
                        <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef' }}>
                          ${payment.amount.toFixed(2)}
                        </td>
                        <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef' }}>
                          <strong style={{ color: '#4CAF50' }}>${payment.commission.toFixed(2)}</strong>
                        </td>
                        <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef' }}>
                          {payment.date}
                        </td>
                        <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            background: payment.status === 'processed' ? '#e8f5e8' : 
                                      payment.status === 'pending' ? '#fff3cd' : '#f8d7da',
                            color: payment.status === 'processed' ? '#4CAF50' : 
                                  payment.status === 'pending' ? '#856404' : '#721c24'
                          }}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </td>
                        <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef' }}>
                          {payment.status === 'pending' && (
                            <button
                              onClick={() => processPayment(payment.id)}
                              style={{
                                background: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Process
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h3 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '20px', fontWeight: 'bold' }}>
                Commission Performance Analytics
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '15px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>Commission by Category</h4>
                  {[
                    { category: 'Electronics', commission: 5850.20, percentage: 41 },
                    { category: 'Art & Collectibles', commission: 3420.80, percentage: 24 },
                    { category: 'Fashion', commission: 2890.50, percentage: 20 },
                    { category: 'Home & Garden', commission: 1510.00, percentage: 11 },
                    { category: 'Sports', commission: 600.00, percentage: 4 }
                  ].map((item, index) => (
                    <div key={index} style={{ marginBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '14px', color: '#333' }}>{item.category}</span>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#4CAF50' }}>
                          ${item.commission.toLocaleString()}
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
                          width: `${item.percentage}%`,
                          height: '100%',
                          background: '#4CAF50',
                          borderRadius: '4px'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '15px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>Monthly Trends</h4>
                  <div style={{ height: '200px', display: 'flex', alignItems: 'end', gap: '8px' }}>
                    {[2100, 2450, 2800, 3200, 3650, 3420].map((value, index) => (
                      <div
                        key={index}
                        style={{
                          flex: 1,
                          height: `${(value / 3650) * 100}%`,
                          background: '#2196F3',
                          borderRadius: '4px 4px 0 0',
                          display: 'flex',
                          alignItems: 'end',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          paddingBottom: '5px'
                        }}
                      >
                        ${(value / 1000).toFixed(1)}k
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '12px', color: '#666' }}>
                    {['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map(month => (
                      <span key={month}>{month}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Rule Modal */}
      {showAddRule && (
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
            width: '500px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ margin: '0 0 25px 0', color: '#333' }}>Add New Commission Rule</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                Category
              </label>
              <input
                type="text"
                value={newRule.category || ''}
                onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                placeholder="e.g., Jewelry, Books, etc."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                  Min Value ($)
                </label>
                <input
                  type="number"
                  value={newRule.minValue || 0}
                  onChange={(e) => setNewRule({ ...newRule, minValue: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                  Max Value ($)
                </label>
                <input
                  type="number"
                  value={newRule.maxValue || 999999}
                  onChange={(e) => setNewRule({ ...newRule, maxValue: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                Commission Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={newRule.rate || 5.0}
                onChange={(e) => setNewRule({ ...newRule, rate: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddRule(false)}
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
                Cancel
              </button>
              <button
                onClick={handleAddRule}
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
                Add Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCommission;
