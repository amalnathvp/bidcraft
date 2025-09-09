const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Auction = require('../models/Auction');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Get user's orders
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;
  
  let query = {};
  
  // Check if user is buyer or seller
  if (req.query.type === 'purchases') {
    query.buyer = req.user._id;
  } else if (req.query.type === 'sales') {
    query.seller = req.user._id;
  } else {
    // Show both purchases and sales
    query.$or = [
      { buyer: req.user._id },
      { seller: req.user._id }
    ];
  }
  
  // Filter by status
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  const orders = await Order.find(query)
    .populate('buyer', 'name email avatar')
    .populate('seller', 'name shopName avatar')
    .populate('auction', 'title images')
    .populate('payment', 'amount status paymentMethod')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(startIndex);
  
  const total = await Order.countDocuments(query);
  
  res.status(200).json({
    success: true,
    count: orders.length,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      total
    },
    data: orders
  });
});

// @desc    Get single order
// @route   GET /api/orders/:orderId
// @access  Private
const getOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.orderId)
    .populate('buyer', 'name email avatar phone')
    .populate('seller', 'name shopName avatar phone')
    .populate('auction', 'title description images category')
    .populate('payment', 'amount status paymentMethod gateway fees');
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }
  
  // Check authorization
  const isAuthorized = req.user.role === 'admin' || 
                      order.buyer._id.toString() === req.user._id.toString() ||
                      order.seller._id.toString() === req.user._id.toString();
  
  if (!isAuthorized) {
    return next(new AppError('Unauthorized access', 403));
  }
  
  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Update order status
// @route   PATCH /api/orders/:orderId/status
// @access  Private
const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status, trackingNumber, carrier, notes } = req.body;
  
  const order = await Order.findById(req.params.orderId);
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }
  
  // Check authorization (seller can update shipping, buyer can confirm delivery)
  const isSeller = order.seller.toString() === req.user._id.toString();
  const isBuyer = order.buyer.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  
  if (!isSeller && !isBuyer && !isAdmin) {
    return next(new AppError('Unauthorized to update order', 403));
  }
  
  // Validate status transitions
  const validTransitions = {
    'pending_payment': ['payment_confirmed', 'cancelled'],
    'payment_confirmed': ['processing', 'cancelled'],
    'processing': ['shipped', 'cancelled'],
    'shipped': ['in_transit', 'delivered'],
    'in_transit': ['delivered'],
    'delivered': ['completed', 'disputed'],
    'completed': ['disputed']
  };
  
  if (status && !validTransitions[order.status]?.includes(status)) {
    return next(new AppError('Invalid status transition', 400));
  }
  
  // Update order
  if (status) {
    order.status = status;
    
    // Set timestamps based on status
    switch (status) {
      case 'shipped':
        order.shippedDate = new Date();
        if (trackingNumber) order.shipping.trackingNumber = trackingNumber;
        if (carrier) order.shipping.carrier = carrier;
        order.calculateDeliveryEstimate();
        break;
      case 'delivered':
        if (isBuyer || isAdmin) {
          order.deliveredDate = new Date();
        } else {
          return next(new AppError('Only buyer can confirm delivery', 403));
        }
        break;
      case 'completed':
        order.completedDate = new Date();
        // Release escrow funds
        if (order.payment) {
          const payment = await Payment.findById(order.payment);
          if (payment && payment.escrow.status === 'holding') {
            payment.escrow.status = 'released';
            await payment.save();
          }
        }
        break;
    }
  }
  
  await order.save();
  
  res.status(200).json({
    success: true,
    message: 'Order updated successfully',
    data: order
  });
});

// @desc    Add message to order
// @route   POST /api/orders/:orderId/messages
// @access  Private
const addOrderMessage = asyncHandler(async (req, res, next) => {
  const { message } = req.body;
  
  if (!message || message.trim().length === 0) {
    return next(new AppError('Message content is required', 400));
  }
  
  const order = await Order.findById(req.params.orderId);
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }
  
  // Check authorization
  const isAuthorized = order.buyer.toString() === req.user._id.toString() ||
                      order.seller.toString() === req.user._id.toString() ||
                      req.user.role === 'admin';
  
  if (!isAuthorized) {
    return next(new AppError('Unauthorized access', 403));
  }
  
  // Add message
  order.messages.push({
    sender: req.user._id,
    message: message.trim()
  });
  
  await order.save();
  
  // Populate the new message for response
  await order.populate('messages.sender', 'name avatar');
  
  res.status(200).json({
    success: true,
    message: 'Message added successfully',
    data: order.messages[order.messages.length - 1]
  });
});

// @desc    Confirm delivery
// @route   POST /api/orders/:orderId/confirm-delivery
// @access  Private (Buyer only)
const confirmDelivery = asyncHandler(async (req, res, next) => {
  const { photos, notes } = req.body;
  
  const order = await Order.findById(req.params.orderId)
    .populate('payment');
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }
  
  // Only buyer can confirm delivery
  if (order.buyer.toString() !== req.user._id.toString()) {
    return next(new AppError('Only the buyer can confirm delivery', 403));
  }
  
  if (order.status !== 'shipped' && order.status !== 'in_transit') {
    return next(new AppError('Order must be shipped before confirming delivery', 400));
  }
  
  // Confirm delivery
  await order.confirmDelivery(req.user._id, photos, notes);
  
  res.status(200).json({
    success: true,
    message: 'Delivery confirmed successfully',
    data: order
  });
});

// @desc    Initiate dispute
// @route   POST /api/orders/:orderId/dispute
// @access  Private
const initiateDispute = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  
  if (!reason || reason.trim().length === 0) {
    return next(new AppError('Dispute reason is required', 400));
  }
  
  const order = await Order.findById(req.params.orderId);
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }
  
  // Check authorization
  const isAuthorized = order.buyer.toString() === req.user._id.toString() ||
                      order.seller.toString() === req.user._id.toString();
  
  if (!isAuthorized) {
    return next(new AppError('Unauthorized to initiate dispute', 403));
  }
  
  if (order.dispute.isDisputed) {
    return next(new AppError('Dispute already exists for this order', 400));
  }
  
  // Create dispute
  order.dispute = {
    isDisputed: true,
    reason: reason.trim(),
    initiatedBy: req.user._id,
    initiatedAt: new Date(),
    status: 'open'
  };
  
  order.status = 'disputed';
  await order.save();
  
  res.status(200).json({
    success: true,
    message: 'Dispute initiated successfully',
    data: order
  });
});

// @desc    Get all orders (Admin only)
// @route   GET /api/orders
// @access  Private (Admin only)
const getAllOrders = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const startIndex = (page - 1) * limit;
  
  let query = {};
  
  // Filtering
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  if (req.query.disputed === 'true') {
    query['dispute.isDisputed'] = true;
  }
  
  if (req.query.buyer) {
    query.buyer = req.query.buyer;
  }
  
  if (req.query.seller) {
    query.seller = req.query.seller;
  }
  
  const orders = await Order.find(query)
    .populate('buyer', 'name email')
    .populate('seller', 'name shopName')
    .populate('auction', 'title')
    .populate('payment', 'amount status')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(startIndex);
  
  const total = await Order.countDocuments(query);
  
  // Calculate summary statistics
  const stats = await Order.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalValue: { $sum: '$totalAmount' },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        disputedOrders: {
          $sum: { $cond: ['$dispute.isDisputed', 1, 0] }
        }
      }
    }
  ]);
  
  res.status(200).json({
    success: true,
    count: orders.length,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      total
    },
    stats: stats[0] || {},
    data: orders
  });
});

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res, next) => {
  const { auctionId, shippingAddress, paymentMethod } = req.body;
  
  if (!auctionId) {
    return next(new AppError('Auction ID is required', 400));
  }
  
  // Get auction details
  const auction = await Auction.findById(auctionId)
    .populate('seller', 'name shopName')
    .populate('category', 'name');
  
  if (!auction) {
    return next(new AppError('Auction not found', 404));
  }
  
  if (auction.status !== 'ended' || !auction.winner) {
    return next(new AppError('Auction must be ended with a winner', 400));
  }
  
  if (auction.winner.toString() !== req.user._id.toString()) {
    return next(new AppError('Only auction winner can create order', 403));
  }
  
  // Check if order already exists
  const existingOrder = await Order.findOne({ auction: auctionId });
  if (existingOrder) {
    return next(new AppError('Order already exists for this auction', 400));
  }
  
  // Generate order number
  const orderNumber = 'BC' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
  
  // Create order
  const order = await Order.create({
    orderNumber,
    buyer: req.user._id,
    seller: auction.seller._id,
    auction: auctionId,
    item: {
      title: auction.title,
      description: auction.description,
      images: auction.images.map(img => img.url),
      category: auction.category.name,
      condition: auction.condition
    },
    itemPrice: auction.currentPrice,
    shippingCost: auction.shippingCost || 0,
    tax: auction.currentPrice * 0.08, // 8% tax
    totalAmount: auction.currentPrice + (auction.shippingCost || 0) + (auction.currentPrice * 0.08),
    shippingAddress: shippingAddress || req.user.address,
    paymentMethod,
    status: 'pending_payment'
  });
  
  await order.populate([
    { path: 'buyer', select: 'name email avatar' },
    { path: 'seller', select: 'name shopName avatar' },
    { path: 'auction', select: 'title images' }
  ]);
  
  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: order
  });
});

// @desc    Mark order as delivered
// @route   PUT /api/orders/:orderId/delivered
// @access  Private (Seller only)
const markDelivered = asyncHandler(async (req, res, next) => {
  const { deliveryProof, notes } = req.body;
  
  const order = await Order.findById(req.params.orderId);
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }
  
  // Only seller can mark as delivered
  if (order.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Only seller can mark order as delivered', 403));
  }
  
  if (order.status !== 'shipped' && order.status !== 'in_transit') {
    return next(new AppError('Order must be shipped before marking as delivered', 400));
  }
  
  order.status = 'delivered';
  order.deliveredDate = new Date();
  
  if (deliveryProof) {
    order.deliveryProof = deliveryProof;
  }
  
  if (notes) {
    order.messages.push({
      sender: req.user._id,
      message: `Delivery Notes: ${notes}`,
      messageType: 'system'
    });
  }
  
  await order.save();
  
  res.status(200).json({
    success: true,
    message: 'Order marked as delivered',
    data: order
  });
});

// @desc    Cancel order
// @route   PUT /api/orders/:orderId/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  
  const order = await Order.findById(req.params.orderId);
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }
  
  // Check authorization
  const isAuthorized = order.buyer.toString() === req.user._id.toString() ||
                      order.seller.toString() === req.user._id.toString() ||
                      req.user.role === 'admin';
  
  if (!isAuthorized) {
    return next(new AppError('Unauthorized to cancel order', 403));
  }
  
  // Check if order can be cancelled
  if (!['pending_payment', 'payment_confirmed', 'processing'].includes(order.status)) {
    return next(new AppError('Order cannot be cancelled at this stage', 400));
  }
  
  order.status = 'cancelled';
  order.cancelledDate = new Date();
  order.cancellationReason = reason || 'No reason provided';
  
  // Add system message
  order.messages.push({
    sender: req.user._id,
    message: `Order cancelled. Reason: ${reason || 'No reason provided'}`,
    messageType: 'system'
  });
  
  await order.save();
  
  // Handle payment refund if applicable
  if (order.payment) {
    const payment = await Payment.findById(order.payment);
    if (payment && payment.status === 'completed') {
      payment.refundStatus = 'pending';
      payment.refundReason = 'Order cancelled';
      await payment.save();
    }
  }
  
  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully',
    data: order
  });
});

// @desc    Update dispute status
// @route   PUT /api/orders/:orderId/dispute
// @access  Private (Admin only)
const updateDispute = asyncHandler(async (req, res, next) => {
  const { status, resolution, adminNotes } = req.body;
  
  const order = await Order.findById(req.params.orderId);
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }
  
  if (!order.dispute.isDisputed) {
    return next(new AppError('No dispute exists for this order', 400));
  }
  
  // Update dispute
  order.dispute.status = status;
  order.dispute.resolvedBy = req.user._id;
  order.dispute.resolvedAt = new Date();
  
  if (resolution) {
    order.dispute.resolution = resolution;
  }
  
  if (adminNotes) {
    order.dispute.adminNotes = adminNotes;
  }
  
  // Update order status based on dispute resolution
  if (status === 'resolved') {
    order.status = 'completed';
  } else if (status === 'refunded') {
    order.status = 'refunded';
  }
  
  await order.save();
  
  res.status(200).json({
    success: true,
    message: 'Dispute updated successfully',
    data: order
  });
});

// @desc    Get order messages
// @route   GET /api/orders/:orderId/messages
// @access  Private
const getOrderMessages = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.orderId)
    .populate('messages.sender', 'name avatar');
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }
  
  // Check authorization
  const isAuthorized = order.buyer.toString() === req.user._id.toString() ||
                      order.seller.toString() === req.user._id.toString() ||
                      req.user.role === 'admin';
  
  if (!isAuthorized) {
    return next(new AppError('Unauthorized access', 403));
  }
  
  res.status(200).json({
    success: true,
    data: order.messages
  });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  getUserOrders: getMyOrders,
  getSellerOrders: getMyOrders,
  markDelivered,
  confirmDelivery,
  initiateDispute,
  updateDispute,
  addOrderMessage,
  getOrderMessages,
  cancelOrder,
  getAllOrders
};
