import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBuyerAuth } from '../contexts/BuyerAuthContext.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';
import { useNavigate } from 'react-router';

// Mock data for orders (since we don't have a backend yet)
const mockOrders = [
  {
    id: 'ORD001',
    auctionId: '68dcea0acc82430fa285a972',
    itemName: 'Vintage Camera Collection',
    itemImage: 'https://picsum.photos/400/300?random=1',
    itemCategory: 'Electronics',
    purchasePrice: 650.00,
    tax: 52.00,
    totalAmount: 702.00,
    orderDate: '2024-12-02T10:30:00Z',
    deliveryStatus: 'delivered',
    deliveryAddress: {
      fullName: 'John Doe',
      addressLine1: '123 Main Street',
      city: 'New York',
      state: 'NY',
      postalCode: '10001'
    },
    seller: {
      name: 'Tech Trader',
      email: 'seller@example.com'
    },
    estimatedDelivery: '2024-12-05T00:00:00Z',
    actualDelivery: '2024-12-04T14:20:00Z',
    trackingNumber: 'TRK123456789'
  },
  {
    id: 'ORD002',
    auctionId: '68dd45b3958c1d976c97f30f',
    itemName: 'Antique Pocket Watch',
    itemImage: 'https://picsum.photos/400/300?random=2',
    itemCategory: 'Collectibles',
    purchasePrice: 450.00,
    tax: 36.00,
    totalAmount: 486.00,
    orderDate: '2024-12-01T15:45:00Z',
    deliveryStatus: 'in_transit',
    deliveryAddress: {
      fullName: 'John Doe',
      addressLine1: '123 Main Street',
      city: 'New York',
      state: 'NY',
      postalCode: '10001'
    },
    seller: {
      name: 'Antique Collector',
      email: 'antiques@example.com'
    },
    estimatedDelivery: '2024-12-06T00:00:00Z',
    trackingNumber: 'TRK987654321'
  },
  {
    id: 'ORD003',
    auctionId: '68e1234567890abcdef12345',
    itemName: 'Designer Handbag',
    itemImage: 'https://picsum.photos/400/300?random=3',
    itemCategory: 'Fashion',
    purchasePrice: 320.00,
    tax: 25.60,
    totalAmount: 345.60,
    orderDate: '2024-11-30T09:15:00Z',
    deliveryStatus: 'processing',
    deliveryAddress: {
      fullName: 'John Doe',
      addressLine1: '123 Main Street',
      city: 'New York',
      state: 'NY',
      postalCode: '10001'
    },
    seller: {
      name: 'Fashion House',
      email: 'fashion@example.com'
    },
    estimatedDelivery: '2024-12-08T00:00:00Z',
    trackingNumber: null
  }
];

// API function to get user orders
const getOrders = async () => {
  const response = await fetch('/orders/buyer', {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }
  
  const data = await response.json();
  return data;
};

const getStatusColor = (status) => {
  switch (status) {
    case 'delivered':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'in_transit':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'processing':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'delivered':
      return '✅';
    case 'in_transit':
      return '🚚';
    case 'processing':
      return '📦';
    case 'cancelled':
      return '❌';
    default:
      return '📋';
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const OrderCard = ({ order, onViewDetails }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        {/* Product Image */}
        <div className="w-20 h-20 flex-shrink-0">
          <img
            src={order.itemImage}
            alt={order.itemName}
            className="w-full h-full object-cover rounded-md"
          />
        </div>

        {/* Order Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {order.itemName}
              </h3>
              <p className="text-sm text-gray-600">{order.itemCategory}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.deliveryStatus)}`}>
              <span className="mr-1">{getStatusIcon(order.deliveryStatus)}</span>
              {order.deliveryStatus.replace('_', ' ').toUpperCase()}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500">Order ID</p>
              <p className="text-sm font-medium text-gray-900">{order.id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Order Date</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(order.orderDate)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Amount</p>
              <p className="text-sm font-semibold text-green-600">
                ${order.totalAmount.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-gray-50 rounded-md p-3 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Delivery Address</p>
                <p className="text-sm text-gray-900">
                  {order.deliveryAddress.fullName}<br />
                  {order.deliveryAddress.addressLine1}<br />
                  {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.postalCode}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {order.deliveryStatus === 'delivered' ? 'Delivered On' : 'Estimated Delivery'}
                </p>
                <p className="text-sm text-gray-900">
                  {formatDate(order.actualDelivery || order.estimatedDelivery)}
                </p>
                {order.trackingNumber && (
                  <>
                    <p className="text-xs text-gray-500 mt-2">Tracking Number</p>
                    <p className="text-sm font-mono text-blue-600">{order.trackingNumber}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/auction/${order.auctionId}`)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              View Item
            </button>
            <button
              onClick={() => onViewDetails(order)}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Order Details
            </button>
            {order.trackingNumber && (
              <button className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                Track Package
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderDetailsModal = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="font-medium">{order.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Order Date</p>
                <p className="font-medium">{formatDate(order.orderDate)}</p>
              </div>
            </div>
          </div>

          {/* Item Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Item Details</h3>
            <div className="flex gap-4 bg-gray-50 rounded-lg p-4">
              <img
                src={order.itemImage}
                alt={order.itemName}
                className="w-24 h-24 object-cover rounded-md"
              />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{order.itemName}</h4>
                <p className="text-gray-600">{order.itemCategory}</p>
                <p className="text-sm text-gray-500 mt-2">Seller: {order.seller.name}</p>
              </div>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Pricing Details</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Item Price</span>
                <span className="font-medium">${order.purchasePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">${order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Delivery Information</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Delivery Address</p>
                  <div className="text-gray-900">
                    <p className="font-medium">{order.deliveryAddress.fullName}</p>
                    <p>{order.deliveryAddress.addressLine1}</p>
                    <p>{order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.postalCode}</p>
                  </div>
                </div>
                <div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.deliveryStatus)}`}>
                      <span className="mr-1">{getStatusIcon(order.deliveryStatus)}</span>
                      {order.deliveryStatus.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                  {order.trackingNumber && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Tracking Number</p>
                      <p className="font-mono text-blue-600">{order.trackingNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const BuyerOrders = () => {
  const { isAuthenticated, isLoading: authLoading } = useBuyerAuth();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['buyerOrders'],
    queryFn: getOrders,
    enabled: isAuthenticated,
  });

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/buyer/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading || isLoading) return <LoadingScreen />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Error Loading Orders</h2>
          <p className="text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  const orders = data?.orders || [];
  
  // Filter orders based on status
  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.deliveryStatus === filterStatus);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const orderCounts = {
    all: orders.length,
    processing: orders.filter(o => o.deliveryStatus === 'processing').length,
    in_transit: orders.filter(o => o.deliveryStatus === 'in_transit').length,
    delivered: orders.filter(o => o.deliveryStatus === 'delivered').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your purchased items</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Orders', count: orderCounts.all },
              { key: 'processing', label: 'Processing', count: orderCounts.processing },
              { key: 'in_transit', label: 'In Transit', count: orderCounts.in_transit },
              { key: 'delivered', label: 'Delivered', count: orderCounts.delivered },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setFilterStatus(filter.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === filter.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {filterStatus === 'all' ? 'No Orders Yet' : `No ${filterStatus.replace('_', ' ')} Orders`}
            </h2>
            <p className="text-gray-600 mb-6">
              {filterStatus === 'all' 
                ? "You haven't made any purchases yet. Start bidding or buy items directly!"
                : `You don't have any orders with ${filterStatus.replace('_', ' ')} status.`
              }
            </p>
            <button
              onClick={() => navigate('/live-auctions')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Browse Auctions
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}

        {/* Order Details Modal */}
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      </div>
    </div>
  );
};