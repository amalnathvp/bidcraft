import React, { useState } from 'react';

interface AdminDisputesProps {
  onNavigate: (page: string, data?: any) => void;
}

interface Dispute {
  id: string;
  type: 'payment' | 'item_description' | 'shipping' | 'buyer_complaint' | 'seller_complaint';
  status: 'open' | 'investigating' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  auctionId: string;
  auctionTitle: string;
  complainant: string;
  defendant: string;
  amount: number;
  description: string;
  createdAt: string;
  messages: { sender: string; message: string; timestamp: string; isAdmin?: boolean }[];
}

const AdminDisputes: React.FC<AdminDisputesProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'resolved' | 'escalated'>('active');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const [disputes, setDisputes] = useState<Dispute[]>([
    {
      id: '1',
      type: 'item_description',
      status: 'open',
      priority: 'high',
      auctionId: 'auction_123',
      auctionTitle: 'Vintage Camera Lens',
      complainant: 'buyer@email.com',
      defendant: 'seller@email.com',
      amount: 450,
      description: 'Item received does not match description. Listed as "mint condition" but has visible scratches.',
      createdAt: '2025-09-03 10:30:00',
      messages: [
        {
          sender: 'buyer@email.com',
          message: 'The camera lens I received has multiple scratches on the front element, which was not mentioned in the description.',
          timestamp: '2025-09-03 10:30:00'
        },
        {
          sender: 'seller@email.com',
          message: 'I described it as vintage condition. Some wear is expected for items of this age.',
          timestamp: '2025-09-03 11:15:00'
        }
      ]
    },
    {
      id: '2',
      type: 'payment',
      status: 'investigating',
      priority: 'urgent',
      auctionId: 'auction_456',
      auctionTitle: 'Designer Handbag',
      complainant: 'seller@boutique.com',
      defendant: 'buyer123@email.com',
      amount: 850,
      description: 'Payment was disputed by buyer after item was shipped and delivered.',
      createdAt: '2025-09-02 14:20:00',
      messages: [
        {
          sender: 'seller@boutique.com',
          message: 'Buyer initiated a chargeback claim with their credit card company after receiving the item.',
          timestamp: '2025-09-02 14:20:00'
        },
        {
          sender: 'admin',
          message: 'We are investigating this payment dispute. Please provide tracking information and proof of delivery.',
          timestamp: '2025-09-02 15:30:00',
          isAdmin: true
        }
      ]
    },
    {
      id: '3',
      type: 'shipping',
      status: 'resolved',
      priority: 'medium',
      auctionId: 'auction_789',
      auctionTitle: 'Collectible Comic Book',
      complainant: 'collector@comics.com',
      defendant: 'seller456@email.com',
      amount: 120,
      description: 'Item was damaged during shipping due to inadequate packaging.',
      createdAt: '2025-09-01 16:45:00',
      messages: [
        {
          sender: 'collector@comics.com',
          message: 'The comic book arrived with bent corners due to poor packaging.',
          timestamp: '2025-09-01 16:45:00'
        },
        {
          sender: 'admin',
          message: 'After reviewing the case, we have issued a partial refund to cover the damage. The seller has been advised on proper packaging procedures.',
          timestamp: '2025-09-02 09:30:00',
          isAdmin: true
        }
      ]
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#f44336';
      case 'investigating': return '#FF9800';
      case 'resolved': return '#4CAF50';
      case 'escalated': return '#9C27B0';
      default: return '#666';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#f44336';
      case 'urgent': return '#9C27B0';
      default: return '#666';
    }
  };

  const getFilteredDisputes = () => {
    if (activeTab === 'active') return disputes.filter(d => ['open', 'investigating'].includes(d.status));
    if (activeTab === 'resolved') return disputes.filter(d => d.status === 'resolved');
    if (activeTab === 'escalated') return disputes.filter(d => d.status === 'escalated');
    return disputes;
  };

  const updateDisputeStatus = (disputeId: string, newStatus: string) => {
    setDisputes(disputes =>
      disputes.map(dispute =>
        dispute.id === disputeId ? { ...dispute, status: newStatus as any } : dispute
      )
    );
  };

  const addMessage = () => {
    if (!selectedDispute || !newMessage.trim()) return;

    const message = {
      sender: 'admin',
      message: newMessage,
      timestamp: new Date().toISOString(),
      isAdmin: true
    };

    setDisputes(disputes =>
      disputes.map(dispute =>
        dispute.id === selectedDispute.id 
          ? { ...dispute, messages: [...dispute.messages, message] }
          : dispute
      )
    );

    setSelectedDispute(prev => prev ? { ...prev, messages: [...prev.messages, message] } : null);
    setNewMessage('');
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
                  ⚖️ Dispute Resolution
                </h1>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '0' }}>
                  Handle customer disputes and transaction issues
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
              ⚡ {disputes.filter(d => ['open', 'investigating'].includes(d.status)).length} Active Cases
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
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>📋</div>
            <h3 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#f44336' }}>
              {disputes.filter(d => d.status === 'open').length}
            </h3>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Open Disputes</p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔍</div>
            <h3 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
              {disputes.filter(d => d.status === 'investigating').length}
            </h3>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Under Investigation</p>
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
              {disputes.filter(d => d.status === 'resolved').length}
            </h3>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Resolved</p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏱️</div>
            <h3 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
              2.3
            </h3>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Avg Resolution Days</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { key: 'active', label: 'Active Disputes', icon: '🔥', count: disputes.filter(d => ['open', 'investigating'].includes(d.status)).length },
              { key: 'resolved', label: 'Resolved', icon: '✅', count: disputes.filter(d => d.status === 'resolved').length },
              { key: 'escalated', label: 'Escalated', icon: '🚨', count: disputes.filter(d => d.status === 'escalated').length }
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
                  color: 'white',
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

        {/* Disputes List */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ margin: '0 0 25px 0', color: '#333', fontSize: '20px', fontWeight: 'bold' }}>
            {activeTab === 'active' && 'Active Disputes'}
            {activeTab === 'resolved' && 'Resolved Disputes'}
            {activeTab === 'escalated' && 'Escalated Disputes'}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {getFilteredDisputes().map((dispute) => (
              <div key={dispute.id} style={{
                border: dispute.priority === 'urgent' ? '2px solid #9C27B0' : '1px solid #e9ecef',
                borderRadius: '15px',
                padding: '25px',
                background: '#f8f9fa'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                      <h4 style={{ margin: '0', color: '#333', fontSize: '16px', fontWeight: 'bold' }}>
                        Case #{dispute.id} - {dispute.auctionTitle}
                      </h4>
                      <span style={{
                        background: getStatusColor(dispute.status),
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>
                        {dispute.status}
                      </span>
                      <span style={{
                        background: getPriorityColor(dispute.priority),
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>
                        {dispute.priority}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                      <div>
                        <strong>Type:</strong> {dispute.type.replace('_', ' ')}
                      </div>
                      <div>
                        <strong>Amount:</strong> ${dispute.amount}
                      </div>
                      <div>
                        <strong>Complainant:</strong> {dispute.complainant}
                      </div>
                      <div>
                        <strong>Created:</strong> {new Date(dispute.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <p style={{ margin: '0', color: '#666', fontSize: '14px', lineHeight: '1.5' }}>
                      {dispute.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}>
                    <button
                      onClick={() => setSelectedDispute(dispute)}
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
                      💬 View Messages
                    </button>

                    {activeTab === 'active' && (
                      <>
                        {dispute.status === 'open' && (
                          <button
                            onClick={() => updateDisputeStatus(dispute.id, 'investigating')}
                            style={{
                              background: '#FF9800',
                              color: 'white',
                              border: 'none',
                              padding: '10px 20px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '500'
                            }}
                          >
                            🔍 Investigate
                          </button>
                        )}
                        {dispute.status === 'investigating' && (
                          <button
                            onClick={() => updateDisputeStatus(dispute.id, 'resolved')}
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
                            ✅ Resolve
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div style={{ 
                  background: 'white', 
                  padding: '15px', 
                  borderRadius: '10px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                      💬 {dispute.messages.length} messages • Last activity: {new Date(dispute.messages[dispute.messages.length - 1].timestamp).toLocaleDateString()}
                    </span>
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      {dispute.complainant} vs {dispute.defendant}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Message Modal */}
      {selectedDispute && (
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
            width: '700px',
            maxWidth: '90vw',
            height: '600px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{ 
              padding: '20px 30px', 
              borderBottom: '1px solid #e9ecef',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: '0', color: '#333' }}>Case #{selectedDispute.id} - Messages</h3>
                <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
                  {selectedDispute.auctionTitle} • ${selectedDispute.amount}
                </p>
              </div>
              <button
                onClick={() => setSelectedDispute(null)}
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

            {/* Messages */}
            <div style={{ 
              flex: 1,
              padding: '20px 30px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              {selectedDispute.messages.map((message, index) => (
                <div
                  key={index}
                  style={{
                    alignSelf: message.isAdmin ? 'flex-end' : 'flex-start',
                    maxWidth: '70%'
                  }}
                >
                  <div style={{
                    background: message.isAdmin ? '#667eea' : '#f8f9fa',
                    color: message.isAdmin ? 'white' : '#333',
                    padding: '12px 16px',
                    borderRadius: '15px',
                    marginBottom: '5px'
                  }}>
                    <p style={{ margin: '0', fontSize: '14px', lineHeight: '1.4' }}>
                      {message.message}
                    </p>
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#666',
                    textAlign: message.isAdmin ? 'right' : 'left',
                    paddingLeft: message.isAdmin ? '0' : '16px',
                    paddingRight: message.isAdmin ? '16px' : '0'
                  }}>
                    {message.isAdmin ? 'Admin' : message.sender} • {new Date(message.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div style={{ 
              padding: '20px 30px',
              borderTop: '1px solid #e9ecef',
              display: 'flex',
              gap: '15px',
              alignItems: 'center'
            }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your response..."
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '25px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onKeyPress={(e) => e.key === 'Enter' && addMessage()}
              />
              <button
                onClick={addMessage}
                style={{
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDisputes;
