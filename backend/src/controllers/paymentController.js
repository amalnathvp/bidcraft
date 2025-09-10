const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Auction = require('../models/Auction');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// Initialize Stripe only if API key is provided
let stripe = null;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'your_stripe_secret_key_here') {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  console.log('✅ Stripe initialized successfully');
} else {
  console.log('⚠️ Stripe not initialized - STRIPE_SECRET_KEY not configured');
}

// @desc    Create payment intent for auction win
// @route   POST /api/payments/create-intent
// @access  Private
const createPaymentIntent = asyncHandler(async (req, res, next) => {
  const { auctionId, paymentMethod } = req.body;
  
  // Get auction details
  const auction = await Auction.findById(auctionId)
    .populate('seller', 'name shopName')
    .populate('highestBid', 'amount bidder');
  
  if (!auction) {
    return next(new AppError('Auction not found', 404));
  }
  
  // Verify user is the winner
  if (!auction.highestBid || auction.highestBid.bidder.toString() !== req.user._id.toString()) {
    return next(new AppError('You are not the winner of this auction', 403));
  }
  
  // Calculate total amount including fees
  const itemPrice = auction.currentPrice;
  const shippingCost = auction.shipping.cost || 0;
  const platformFeePercentage = req.user.commissionRate || 5;
  const platformFee = (itemPrice * platformFeePercentage) / 100;
  const totalAmount = itemPrice + shippingCost + platformFee;
  
  try {
    let paymentIntent;
    
    // Create payment based on method
    switch (paymentMethod) {
      case 'stripe':
        if (!stripe) {
          return next(new AppError('Stripe payment processing is not configured. Please contact administrator.', 503));
        }
        paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(totalAmount * 100), // Stripe uses cents
          currency: 'usd',
          metadata: {
            auctionId: auction._id.toString(),
            buyerId: req.user._id.toString(),
            sellerId: auction.seller._id.toString()
          },
          description: `Payment for auction: ${auction.title}`
        });
        break;
      
      case 'paypal':
        // PayPal integration would go here
        paymentIntent = {
          id: `pp_${Date.now()}`,
          client_secret: 'paypal_secret_placeholder',
          status: 'requires_payment_method'
        };
        break;
      
      default:
        return next(new AppError('Unsupported payment method', 400));
    }
    
    // Create payment record
    const payment = await Payment.create({
      paymentId: paymentIntent.id,
      transactionId: paymentIntent.id,
      user: req.user._id,
      auction: auction._id,
      amount: totalAmount,
      paymentMethod: {
        type: paymentMethod,
        provider: paymentMethod
      },
      gateway: {
        name: paymentMethod,
        transactionId: paymentIntent.id,
        responseData: paymentIntent
      },
      fees: {
        platformFee: platformFee,
        totalFees: platformFee
      }
    });
    
    // Calculate fees
    payment.calculateFees(platformFeePercentage);
    await payment.save();
    
    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentId: payment._id,
        amount: totalAmount,
        breakdown: {
          itemPrice,
          shippingCost,
          platformFee,
          totalAmount
        }
      }
    });
    
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    return next(new AppError('Failed to create payment intent', 500));
  }
});

// @desc    Confirm payment
// @route   POST /api/payments/:paymentId/confirm
// @access  Private
const confirmPayment = asyncHandler(async (req, res, next) => {
  const { paymentId } = req.params;
  const { paymentIntentId } = req.body;
  
  const payment = await Payment.findById(paymentId)
    .populate('auction')
    .populate('user');
  
  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }
  
  if (payment.user._id.toString() !== req.user._id.toString()) {
    return next(new AppError('Unauthorized access to payment', 403));
  }
  
  try {
    // Verify payment with gateway
    let paymentConfirmed = false;
    
    switch (payment.gateway.name) {
      case 'stripe':
        if (!stripe) {
          return next(new AppError('Stripe payment processing is not configured', 503));
        }
        const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
        paymentConfirmed = intent.status === 'succeeded';
        payment.gateway.responseData = intent;
        break;
      
      case 'paypal':
        // PayPal verification would go here
        paymentConfirmed = true; // Placeholder
        break;
      
      default:
        return next(new AppError('Unsupported payment gateway', 400));
    }
    
    if (paymentConfirmed) {
      // Update payment status
      payment.status = 'completed';
      payment.completedAt = new Date();
      await payment.save();
      
      // Create order
      const order = await Order.create({
        buyer: payment.user._id,
        seller: payment.auction.seller,
        auction: payment.auction._id,
        payment: payment._id,
        item: {
          title: payment.auction.title,
          description: payment.auction.description,
          images: payment.auction.images.map(img => img.url),
          category: payment.auction.category,
          condition: payment.auction.condition
        },
        itemPrice: payment.auction.currentPrice,
        shippingCost: payment.auction.shipping.cost || 0,
        platformFee: payment.fees.platformFee,
        totalAmount: payment.amount
      });
      
      // Update auction status
      payment.auction.status = 'sold';
      payment.auction.soldAt = new Date();
      await payment.auction.save();
      
      // Update seller's total sales
      await User.findByIdAndUpdate(payment.auction.seller, {
        $inc: { totalSales: payment.auction.currentPrice }
      });
      
      res.status(200).json({
        success: true,
        message: 'Payment confirmed successfully',
        data: {
          payment,
          order,
          orderNumber: order.orderNumber
        }
      });
    } else {
      payment.status = 'failed';
      await payment.save();
      
      return next(new AppError('Payment confirmation failed', 400));
    }
    
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return next(new AppError('Payment confirmation failed', 500));
  }
});

// @desc    Get user's payment history
// @route   GET /api/payments/my-payments
// @access  Private
const getMyPayments = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;
  
  let query = { user: req.user._id };
  
  // Filter by status
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  const payments = await Payment.find(query)
    .populate('auction', 'title images')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(startIndex);
  
  const total = await Payment.countDocuments(query);
  
  res.status(200).json({
    success: true,
    count: payments.length,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      total
    },
    data: payments
  });
});

// @desc    Process refund
// @route   POST /api/payments/:paymentId/refund
// @access  Private (Admin or involved parties)
const processRefund = asyncHandler(async (req, res, next) => {
  const { paymentId } = req.params;
  const { amount, reason } = req.body;
  
  const payment = await Payment.findById(paymentId)
    .populate('user')
    .populate('auction');
  
  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }
  
  // Check authorization
  const isAuthorized = req.user.role === 'admin' || 
                      payment.user._id.toString() === req.user._id.toString() ||
                      payment.auction.seller.toString() === req.user._id.toString();
  
  if (!isAuthorized) {
    return next(new AppError('Unauthorized to process refund', 403));
  }
  
  if (payment.status !== 'completed') {
    return next(new AppError('Can only refund completed payments', 400));
  }
  
  try {
    // Process refund through gateway
    let refundResult;
    
    switch (payment.gateway.name) {
      case 'stripe':
        if (!stripe) {
          return next(new AppError('Stripe payment processing is not configured', 503));
        }
        refundResult = await stripe.refunds.create({
          payment_intent: payment.gateway.transactionId,
          amount: amount ? Math.round(amount * 100) : undefined
        });
        break;
      
      case 'paypal':
        // PayPal refund would go here
        refundResult = { id: `ref_${Date.now()}`, status: 'succeeded' };
        break;
    }
    
    // Update payment record
    await payment.processRefund(amount || payment.amount, reason);
    
    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundId: refundResult.id,
        amount: amount || payment.amount,
        status: payment.status
      }
    });
    
  } catch (error) {
    console.error('Refund processing error:', error);
    return next(new AppError('Refund processing failed', 500));
  }
});

// @desc    Get payment details
// @route   GET /api/payments/:paymentId
// @access  Private
const getPayment = asyncHandler(async (req, res, next) => {
  const payment = await Payment.findById(req.params.paymentId)
    .populate('user', 'name email')
    .populate('auction', 'title seller')
    .populate('order');
  
  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }
  
  // Check authorization
  const isAuthorized = req.user.role === 'admin' || 
                      payment.user._id.toString() === req.user._id.toString() ||
                      payment.auction.seller.toString() === req.user._id.toString();
  
  if (!isAuthorized) {
    return next(new AppError('Unauthorized access', 403));
  }
  
  res.status(200).json({
    success: true,
    data: payment
  });
});

// @desc    Get all payments (Admin only)
// @route   GET /api/payments
// @access  Private (Admin only)
const getAllPayments = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const startIndex = (page - 1) * limit;
  
  let query = {};
  
  // Filtering
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  if (req.query.gateway) {
    query['gateway.name'] = req.query.gateway;
  }
  
  if (req.query.user) {
    query.user = req.query.user;
  }
  
  const payments = await Payment.find(query)
    .populate('user', 'name email')
    .populate('auction', 'title seller')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(startIndex);
  
  const total = await Payment.countDocuments(query);
  
  // Calculate summary statistics
  const stats = await Payment.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalFees: { $sum: '$fees.totalFees' },
        completedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        pendingPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        }
      }
    }
  ]);
  
  res.status(200).json({
    success: true,
    count: payments.length,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      total
    },
    stats: stats[0] || {},
    data: payments
  });
});

// @desc    Create PayPal payment
// @route   POST /api/payments/paypal/create
// @access  Private
const createPayPalPayment = asyncHandler(async (req, res, next) => {
  const { orderId, amount } = req.body;
  
  if (!orderId || !amount) {
    return next(new AppError('Order ID and amount are required', 400));
  }
  
  // For demo purposes, create a mock PayPal payment
  const mockPayPalPayment = {
    paymentId: 'PAYPAL_' + Date.now(),
    approvalUrl: `https://sandbox.paypal.com/approve?token=MOCK_TOKEN_${Date.now()}`,
    status: 'created',
    amount,
    currency: 'USD'
  };
  
  // Create payment record
  const payment = await Payment.create({
    order: orderId,
    user: req.user._id,
    amount,
    paymentMethod: 'paypal',
    gateway: 'paypal',
    gatewayPaymentId: mockPayPalPayment.paymentId,
    status: 'pending',
    escrow: {
      status: 'pending',
      amount
    }
  });
  
  res.status(200).json({
    success: true,
    message: 'PayPal payment created (Demo Mode)',
    data: {
      payment,
      paypalData: mockPayPalPayment
    }
  });
});

// @desc    Execute PayPal payment
// @route   POST /api/payments/paypal/execute
// @access  Private
const executePayPalPayment = asyncHandler(async (req, res, next) => {
  const { paymentId, payerId } = req.body;
  
  if (!paymentId || !payerId) {
    return next(new AppError('Payment ID and Payer ID are required', 400));
  }
  
  const payment = await Payment.findOne({ gatewayPaymentId: paymentId });
  
  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }
  
  if (payment.user.toString() !== req.user._id.toString()) {
    return next(new AppError('Unauthorized access', 403));
  }
  
  // Mock PayPal execution
  payment.status = 'completed';
  payment.completedAt = new Date();
  payment.gatewayResponse = {
    payerId,
    executedAt: new Date(),
    transactionId: 'TXN_' + Date.now()
  };
  payment.escrow.status = 'holding';
  
  await payment.save();
  
  // Update order status
  await Order.findByIdAndUpdate(payment.order, {
    status: 'payment_confirmed'
  });
  
  res.status(200).json({
    success: true,
    message: 'PayPal payment executed successfully (Demo Mode)',
    data: payment
  });
});

// @desc    Release escrow funds
// @route   POST /api/payments/:paymentId/release-escrow
// @access  Private (Admin only)
const releaseEscrow = asyncHandler(async (req, res, next) => {
  const payment = await Payment.findById(req.params.paymentId)
    .populate('order');
  
  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }
  
  if (payment.escrow.status !== 'holding') {
    return next(new AppError('Escrow funds not in holding status', 400));
  }
  
  // Release escrow
  payment.escrow.status = 'released';
  payment.escrow.releasedAt = new Date();
  payment.escrow.releasedBy = req.user._id;
  
  // Calculate seller payout (minus platform fee)
  const platformFeeRate = 0.05; // 5% platform fee
  const platformFee = payment.amount * platformFeeRate;
  const sellerPayout = payment.amount - platformFee;
  
  payment.escrow.platformFee = platformFee;
  payment.escrow.sellerPayout = sellerPayout;
  
  await payment.save();
  
  // Update order status
  if (payment.order) {
    await Order.findByIdAndUpdate(payment.order._id, {
      status: 'completed'
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Escrow funds released successfully',
    data: {
      payment,
      platformFee,
      sellerPayout
    }
  });
});

// @desc    Request refund
// @route   POST /api/payments/:paymentId/refund
// @access  Private
const requestRefund = asyncHandler(async (req, res, next) => {
  const { reason, amount } = req.body;
  
  const payment = await Payment.findById(req.params.paymentId)
    .populate('order');
  
  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }
  
  // Check authorization (buyer can request refund)
  if (payment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Unauthorized to request refund', 403));
  }
  
  if (payment.status !== 'completed') {
    return next(new AppError('Payment must be completed to request refund', 400));
  }
  
  if (payment.refundStatus && payment.refundStatus !== 'failed') {
    return next(new AppError('Refund already requested or processed', 400));
  }
  
  const refundAmount = amount || payment.amount;
  
  if (refundAmount > payment.amount) {
    return next(new AppError('Refund amount cannot exceed payment amount', 400));
  }
  
  // Create refund request
  payment.refundStatus = 'pending';
  payment.refundAmount = refundAmount;
  payment.refundReason = reason;
  payment.refundRequestedAt = new Date();
  payment.refundRequestedBy = req.user._id;
  
  await payment.save();
  
  res.status(200).json({
    success: true,
    message: 'Refund requested successfully',
    data: payment
  });
});

module.exports = {
  createPaymentIntent,
  confirmPayment,
  createPayPalPayment,
  executePayPalPayment,
  releaseEscrow,
  requestRefund,
  processRefund,
  getPaymentDetails: getPayment,
  getUserPayments: getMyPayments,
  getPaymentAnalytics: getAllPayments
};
