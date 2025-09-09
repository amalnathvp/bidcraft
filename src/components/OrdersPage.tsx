import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface Order {
  _id: string;
  auction: {
    _id: string;
    title: string;
    images: Array<{ url: string; alt?: string }>;
  };
  buyer: {
    _id: string;
    name: string;
    email: string;
  };
  seller: {
    _id: string;
    name: string;
    shopName?: string;
  };
  finalPrice: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'disputed';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  trackingInfo?: {
    carrier: string;
    trackingNumber: string;
    estimatedDelivery: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface OrdersPageProps {
  onNavigate?: (page: string, data?: any) => void;
  userRole?: 'buyer' | 'seller' | 'admin';
}

const OrdersPage: React.FC<OrdersPageProps> = ({ onNavigate, userRole = 'buyer' }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const endpoint = userRole === 'seller' ? '/orders/seller' : '/orders';
      const params = selectedStatus !== 'all' ? `?status=${selectedStatus}` : '';
      
      const response = await apiService.get(`${endpoint}${params}`);
      
      if (response.success) {
        setOrders(response.data);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await apiService.put(`/orders/${orderId}/status`, { status: newStatus });
      
      if (response.success) {
        setOrders(orders.map(order => 
          order._id === orderId ? { ...order, status: newStatus as any } : order
        ));
      } else {
        alert('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const markAsDelivered = async (orderId: string) => {
    try {
      const response = await apiService.post(`/orders/${orderId}/delivered`, {});
      
      if (response.success) {
        setOrders(orders.map(order => 
          order._id === orderId ? { ...order, status: 'delivered' as any } : order
        ));
      } else {
        alert('Failed to mark as delivered');
      }
    } catch (error) {
      console.error('Error marking as delivered:', error);
      alert('Failed to mark as delivered');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.seller.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pending': '#fbbf24',
      'confirmed': '#3b82f6',
      'shipped': '#8b5cf6',
      'delivered': '#10b981',
      'cancelled': '#ef4444',
      'disputed': '#f59e0b'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusIcon = (status: string) => {
    const icons: { [key: string]: string } = {
      'pending': 'fas fa-clock',
      'confirmed': 'fas fa-check-circle',
      'shipped': 'fas fa-shipping-fast',
      'delivered': 'fas fa-box-open',
      'cancelled': 'fas fa-times-circle',
      'disputed': 'fas fa-exclamation-triangle'
    };
    return icons[status] || 'fas fa-question-circle';
  };

  if (loading) {
    return (
      <div className="orders-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="container">
        <div className="page-header">
          <button className="back-button" onClick={() => onNavigate?.('home')}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <h1>
            <i className="fas fa-shopping-bag"></i>
            {userRole === 'seller' ? 'Sales Orders' : 'My Orders'}
          </h1>
          <p>Manage and track your {userRole === 'seller' ? 'sales' : 'orders'}</p>
        </div>

        {error && (
          <div className="error-banner">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}

        <div className="orders-controls">
          <div className="search-bar">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="status-filters">
            {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(status => (
              <button
                key={status}
                className={`filter-btn ${selectedStatus === status ? 'active' : ''}`}
                onClick={() => setSelectedStatus(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                <span className="count">
                  {status === 'all' ? orders.length : orders.filter(o => o.status === status).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="orders-list">
          {filteredOrders.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-shopping-bag"></i>
              <h3>No orders found</h3>
              <p>{userRole === 'seller' ? 'No sales yet' : 'You haven\'t placed any orders yet'}</p>
              <button 
                className="btn-primary"
                onClick={() => onNavigate?.('live-auctions')}
              >
                Browse Auctions
              </button>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <h3>Order #{order._id.slice(-8)}</h3>
                    <span className="order-date">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="order-status">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      <i className={getStatusIcon(order.status)}></i>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="order-content">
                  <div className="order-item">
                    <div className="item-image">
                      <img
                        src={order.auction.images[0]?.url || '/placeholder-image.jpg'}
                        alt={order.auction.title}
                      />
                    </div>
                    <div className="item-details">
                      <h4>{order.auction.title}</h4>
                      <p className="price">${order.finalPrice}</p>
                      <div className="participants">
                        <span className="buyer">
                          <i className="fas fa-user"></i>
                          Buyer: {order.buyer.name}
                        </span>
                        <span className="seller">
                          <i className="fas fa-store"></i>
                          Seller: {order.seller.shopName || order.seller.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {order.trackingInfo && (
                    <div className="tracking-info">
                      <h5>Tracking Information</h5>
                      <div className="tracking-details">
                        <span><strong>Carrier:</strong> {order.trackingInfo.carrier}</span>
                        <span><strong>Tracking #:</strong> {order.trackingInfo.trackingNumber}</span>
                        <span><strong>Est. Delivery:</strong> {new Date(order.trackingInfo.estimatedDelivery).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}

                  <div className="shipping-address">
                    <h5>Shipping Address</h5>
                    <address>
                      {order.shippingAddress.street}<br />
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                      {order.shippingAddress.country}
                    </address>
                  </div>
                </div>

                <div className="order-actions">
                  {userRole === 'seller' && order.status === 'confirmed' && (
                    <button
                      className="btn-outline"
                      onClick={() => updateOrderStatus(order._id, 'shipped')}
                    >
                      <i className="fas fa-shipping-fast"></i>
                      Mark as Shipped
                    </button>
                  )}
                  
                  {userRole === 'seller' && order.status === 'shipped' && (
                    <button
                      className="btn-primary"
                      onClick={() => markAsDelivered(order._id)}
                    >
                      <i className="fas fa-box-open"></i>
                      Mark as Delivered
                    </button>
                  )}

                  {order.status === 'delivered' && (
                    <button
                      className="btn-outline"
                      onClick={() => onNavigate?.('review-order', { orderId: order._id })}
                    >
                      <i className="fas fa-star"></i>
                      Leave Review
                    </button>
                  )}

                  <button
                    className="btn-ghost"
                    onClick={() => onNavigate?.('order-detail', { orderId: order._id })}
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
        .orders-page {
          min-height: 100vh;
          background: #f8fafc;
          padding: 2rem 0;
        }

        .page-header {
          text-align: center;
          margin-bottom: 2rem;
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

        .orders-controls {
          display: flex;
          gap: 2rem;
          margin-bottom: 2rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .search-bar {
          position: relative;
          flex: 1;
          min-width: 300px;
        }

        .search-bar i {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .search-bar input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
        }

        .status-filters {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }

        .filter-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .filter-btn .count {
          background: rgba(0, 0, 0, 0.1);
          padding: 0.125rem 0.375rem;
          border-radius: 10px;
          font-size: 0.75rem;
        }

        .filter-btn.active .count {
          background: rgba(255, 255, 255, 0.2);
        }

        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .order-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .order-info h3 {
          margin: 0 0 0.25rem 0;
          color: #1f2937;
        }

        .order-date {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .status-badge {
          padding: 0.375rem 0.75rem;
          border-radius: 20px;
          color: white;
          font-size: 0.875rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .order-item {
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
          margin: 0 0 0.5rem 0;
          color: #1f2937;
        }

        .price {
          font-size: 1.25rem;
          color: #059669;
          font-weight: 600;
          margin: 0 0 0.75rem 0;
        }

        .participants {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .participants span {
          font-size: 0.875rem;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .tracking-info, .shipping-address {
          background: #f9fafb;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .tracking-info h5, .shipping-address h5 {
          margin: 0 0 0.75rem 0;
          color: #374151;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .tracking-details {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          font-size: 0.875rem;
        }

        .shipping-address address {
          font-style: normal;
          line-height: 1.5;
          color: #6b7280;
        }

        .order-actions {
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
          color: #3b82f6;
          border: 1px solid #3b82f6;
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
          background: #eff6ff;
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
          .orders-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .search-bar {
            min-width: auto;
          }

          .order-item {
            flex-direction: column;
          }

          .order-actions {
            justify-content: stretch;
          }

          .order-actions button {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default OrdersPage;
