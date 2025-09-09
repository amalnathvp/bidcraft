import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface Payment {
  _id: string;
  order: {
    _id: string;
    auction: {
      title: string;
      images: Array<{ url: string; alt?: string }>;
    };
  };
  amount: number;
  currency: string;
  method: 'stripe' | 'paypal';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentIntentId?: string;
  paypalPaymentId?: string;
  escrowStatus: 'held' | 'released' | 'refunded';
  platformFee: number;
  sellerAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface PaymentsPageProps {
  onNavigate?: (page: string, data?: any) => void;
  userRole?: 'buyer' | 'seller' | 'admin';
}

const PaymentsPage: React.FC<PaymentsPageProps> = ({ onNavigate, userRole = 'buyer' }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');

  useEffect(() => {
    fetchPayments();
  }, [selectedStatus, selectedMethod]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      let endpoint = '/payments/user/history';
      
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedMethod !== 'all') params.append('method', selectedMethod);
      
      const queryString = params.toString();
      if (queryString) endpoint += `?${queryString}`;
      
      const response = await apiService.get(endpoint);
      
      if (response.success) {
        setPayments(response.data);
      } else {
        setError('Failed to fetch payments');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const requestRefund = async (paymentId: string, reason: string) => {
    try {
      const response = await apiService.post(`/payments/refund/request`, {
        paymentId,
        reason
      });
      
      if (response.success) {
        setPayments(payments.map(payment => 
          payment._id === paymentId ? { ...payment, status: 'refunded' as any } : payment
        ));
        alert('Refund request submitted successfully');
      } else {
        alert('Failed to request refund');
      }
    } catch (error) {
      console.error('Error requesting refund:', error);
      alert('Failed to request refund');
    }
  };

  const createPayment = async (auctionId: string, paymentMethod: 'stripe' | 'paypal') => {
    try {
      const response = await apiService.post('/payments/create-intent', {
        auctionId,
        paymentMethod
      });
      
      if (response.success) {
        // Redirect to payment processing
        if (paymentMethod === 'stripe') {
          window.location.href = response.data.paymentUrl;
        } else {
          window.location.href = response.data.approvalUrl;
        }
      } else {
        alert('Failed to create payment');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Failed to create payment');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pending': '#fbbf24',
      'completed': '#10b981',
      'failed': '#ef4444',
      'refunded': '#8b5cf6'
    };
    return colors[status] || '#6b7280';
  };

  const getMethodIcon = (method: string) => {
    const icons: { [key: string]: string } = {
      'stripe': 'fab fa-cc-stripe',
      'paypal': 'fab fa-paypal'
    };
    return icons[method] || 'fas fa-credit-card';
  };

  const getEscrowStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'held': '#fbbf24',
      'released': '#10b981',
      'refunded': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="payments-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payments-page">
      <div className="container">
        <div className="page-header">
          <button className="back-button" onClick={() => onNavigate?.('home')}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <h1>
            <i className="fas fa-credit-card"></i>
            Payment History
          </h1>
          <p>View and manage your payment transactions</p>
        </div>

        {error && (
          <div className="error-banner">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}

        <div className="payments-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-dollar-sign"></i>
            </div>
            <div className="stat-content">
              <h3>${payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</h3>
              <p>Total Transactions</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-content">
              <h3>{payments.filter(p => p.status === 'completed').length}</h3>
              <p>Completed</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-content">
              <h3>{payments.filter(p => p.status === 'pending').length}</h3>
              <p>Pending</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-shield-alt"></i>
            </div>
            <div className="stat-content">
              <h3>{payments.filter(p => p.escrowStatus === 'held').length}</h3>
              <p>In Escrow</p>
            </div>
          </div>
        </div>

        <div className="payments-controls">
          <div className="filter-group">
            <label>Status:</label>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Method:</label>
            <select value={selectedMethod} onChange={(e) => setSelectedMethod(e.target.value)}>
              <option value="all">All Methods</option>
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>
        </div>

        <div className="payments-list">
          {payments.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-credit-card"></i>
              <h3>No payments found</h3>
              <p>You haven't made any payments yet</p>
              <button 
                className="btn-primary"
                onClick={() => onNavigate?.('live-auctions')}
              >
                Browse Auctions
              </button>
            </div>
          ) : (
            payments.map(payment => (
              <div key={payment._id} className="payment-card">
                <div className="payment-header">
                  <div className="payment-info">
                    <h3>
                      <i className={getMethodIcon(payment.method)}></i>
                      Payment #{payment._id.slice(-8)}
                    </h3>
                    <span className="payment-date">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="payment-status">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(payment.status) }}
                    >
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="payment-content">
                  <div className="payment-item">
                    <div className="item-image">
                      <img
                        src={payment.order.auction.images[0]?.url || '/placeholder-image.jpg'}
                        alt={payment.order.auction.title}
                      />
                    </div>
                    <div className="item-details">
                      <h4>{payment.order.auction.title}</h4>
                      <div className="payment-amounts">
                        <div className="amount-row">
                          <span>Total Amount:</span>
                          <span className="amount">${payment.amount}</span>
                        </div>
                        <div className="amount-row">
                          <span>Platform Fee:</span>
                          <span className="fee">-${payment.platformFee}</span>
                        </div>
                        <div className="amount-row">
                          <span>Seller Receives:</span>
                          <span className="seller-amount">${payment.sellerAmount}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="escrow-info">
                    <div className="escrow-status">
                      <span>Escrow Status:</span>
                      <span 
                        className="escrow-badge"
                        style={{ backgroundColor: getEscrowStatusColor(payment.escrowStatus) }}
                      >
                        {payment.escrowStatus.charAt(0).toUpperCase() + payment.escrowStatus.slice(1)}
                      </span>
                    </div>
                    {payment.escrowStatus === 'held' && (
                      <p className="escrow-note">
                        Funds are held in escrow until order is delivered and confirmed.
                      </p>
                    )}
                  </div>

                  {payment.paymentIntentId && (
                    <div className="payment-details">
                      <span><strong>Stripe Payment ID:</strong> {payment.paymentIntentId}</span>
                    </div>
                  )}

                  {payment.paypalPaymentId && (
                    <div className="payment-details">
                      <span><strong>PayPal Payment ID:</strong> {payment.paypalPaymentId}</span>
                    </div>
                  )}
                </div>

                <div className="payment-actions">
                  {payment.status === 'completed' && payment.escrowStatus === 'held' && (
                    <button
                      className="btn-outline"
                      onClick={() => {
                        const reason = prompt('Please provide a reason for the refund request:');
                        if (reason) {
                          requestRefund(payment._id, reason);
                        }
                      }}
                    >
                      <i className="fas fa-undo"></i>
                      Request Refund
                    </button>
                  )}
                  
                  {payment.status === 'failed' && (
                    <button
                      className="btn-primary"
                      onClick={() => createPayment(payment.order._id, payment.method)}
                    >
                      <i className="fas fa-redo"></i>
                      Retry Payment
                    </button>
                  )}

                  <button
                    className="btn-ghost"
                    onClick={() => onNavigate?.('payment-detail', { paymentId: payment._id })}
                  >
                    <i className="fas fa-eye"></i>
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .payments-page {
          min-height: 100vh;
          background: #f8fafc;
          padding: 2rem 0;
        }

        .page-header {
          text-align: center;
          margin-bottom: 2rem;
          position: relative;
        }

        .back-button {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #6b7280;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .page-header h1 {
          margin: 0 0 0.5rem 0;
          color: #1f2937;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        .payments-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.5rem;
        }

        .stat-content h3 {
          margin: 0 0 0.25rem 0;
          font-size: 1.75rem;
          color: #1f2937;
        }

        .stat-content p {
          margin: 0;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .payments-controls {
          display: flex;
          gap: 2rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .filter-group label {
          font-weight: 500;
          color: #374151;
        }

        .filter-group select {
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          cursor: pointer;
        }

        .payments-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .payment-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .payment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .payment-info h3 {
          margin: 0 0 0.25rem 0;
          color: #1f2937;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .payment-date {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .status-badge {
          padding: 0.375rem 0.75rem;
          border-radius: 20px;
          color: white;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .payment-item {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .item-image {
          width: 80px;
          height: 80px;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .item-details h4 {
          margin: 0 0 1rem 0;
          color: #1f2937;
        }

        .payment-amounts {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .amount-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
        }

        .amount {
          color: #059669;
          font-weight: 600;
        }

        .fee {
          color: #dc2626;
        }

        .seller-amount {
          color: #7c3aed;
          font-weight: 600;
        }

        .escrow-info {
          background: #f9fafb;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .escrow-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .escrow-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          color: white;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .escrow-note {
          margin: 0;
          font-size: 0.875rem;
          color: #6b7280;
          font-style: italic;
        }

        .payment-details {
          background: #f3f4f6;
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          font-family: monospace;
        }

        .payment-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .btn-primary, .btn-outline, .btn-ghost {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
          border: none;
        }

        .btn-outline {
          background: white;
          color: #dc2626;
          border: 1px solid #dc2626;
        }

        .btn-ghost {
          background: none;
          color: #6b7280;
          border: 1px solid #d1d5db;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-outline:hover {
          background: #fef2f2;
        }

        .btn-ghost:hover {
          background: #f9fafb;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #6b7280;
        }

        .empty-state i {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-state h3 {
          margin: 0 0 0.5rem 0;
          color: #374151;
        }

        .empty-state .btn-primary {
          margin-top: 1.5rem;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
          gap: 1rem;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-banner {
          background: #fef2f2;
          color: #dc2626;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        @media (max-width: 768px) {
          .payments-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .payment-item {
            flex-direction: column;
          }

          .payment-actions {
            justify-content: stretch;
          }

          .payment-actions button {
            flex: 1;
          }

          .payments-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentsPage;
