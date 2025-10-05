import Order from '../models/order.js';
import User from '../models/user.js';
import Product from '../models/product.js';

// Create a new order (called after successful payment)
export const createOrder = async (req, res) => {
  try {
    const {
      auctionId,
      deliveryAddress,
      pricing,
      paymentDetails
    } = req.body;

    const buyerId = req.user.id;

    // Get auction details
    const auction = await Product.findById(auctionId).populate('seller');
    if (!auction) {
      return res.status(404).json({ 
        success: false, 
        message: 'Auction not found' 
      });
    }

    // Get buyer details
    const buyer = await User.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Buyer not found' 
      });
    }

    // Create order
    const order = new Order({
      buyer: buyerId,
      auction: auctionId,
      seller: auction.seller._id,
      itemDetails: {
        itemName: auction.itemName,
        itemDescription: auction.itemDescription,
        itemCategory: auction.itemCategory,
        itemPhotos: auction.itemPhotos,
        itemPhoto: auction.itemPhoto
      },
      pricing,
      deliveryAddress,
      paymentDetails,
      tracking: {
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      }
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: order
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating order'
    });
  }
};

// Get all orders for a buyer
export const getBuyerOrders = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    const skip = (page - 1) * limit;

    // Build query
    const query = { buyer: buyerId };
    if (status && status !== 'all') {
      query.deliveryStatus = status;
    }

    // Get orders with pagination
    const orders = await Order.find(query)
      .populate('auction', 'itemName itemCategory itemPhotos itemPhoto')
      .populate('seller', 'name email')
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get buyer orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
};

// Get all orders for a seller
export const getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    const skip = (page - 1) * limit;

    // Build query
    const query = { seller: sellerId };
    if (status && status !== 'all') {
      query.deliveryStatus = status;
    }

    // Get orders with pagination
    const orders = await Order.find(query)
      .populate('auction', 'itemName itemCategory itemPhotos itemPhoto')
      .populate('buyer', 'name email')
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get seller orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
};

// Get single order details
export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findById(orderId)
      .populate('auction', 'itemName itemCategory itemPhotos itemPhoto')
      .populate('buyer', 'name email')
      .populate('seller', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is authorized to view this order
    if (order.buyer._id.toString() !== userId && order.seller._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order details'
    });
  }
};

// Update order status (for sellers)
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryStatus, trackingNumber, carrier } = req.body;
    const sellerId = req.user.id;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is the seller
    if (order.seller.toString() !== sellerId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    // Update order status
    if (deliveryStatus) {
      order.deliveryStatus = deliveryStatus;
      order.orderStatus = deliveryStatus; // Keep both in sync for now
    }

    if (trackingNumber) {
      order.tracking.trackingNumber = trackingNumber;
    }

    if (carrier) {
      order.tracking.carrier = carrier;
    }

    if (deliveryStatus === 'delivered') {
      order.tracking.actualDelivery = new Date();
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating order status'
    });
  }
};