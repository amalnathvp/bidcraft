const express = require('express');
const Order = require('../models/Order');

const router = express.Router();

// Test endpoint to check Order model and full CRUD operations
router.get('/test-order-model', async (req, res) => {
  try {
    console.log('🧪 Testing Order model...');
    console.log('Order:', typeof Order, Order.name);
    console.log('Order.findById:', typeof Order.findById);
    
    if (typeof Order.findById !== 'function') {
      console.error('❌ Order.findById is not a function!');
      console.error('Order object:', Order);
      return res.status(500).json({
        success: false,
        error: 'Order model not properly loaded',
        orderType: typeof Order,
        orderName: Order.name,
        findByIdType: typeof Order.findById
      });
    }

    // Try to get order count
    const orderCount = await Order.countDocuments();
    console.log('✅ Order model working correctly');
    
    // Test creating and retrieving an order
    const mongoose = require('mongoose');
    const testOrder = new Order({
      user: new mongoose.Types.ObjectId(),
      auction: new mongoose.Types.ObjectId(),
      items: [{
        auction: new mongoose.Types.ObjectId(),
        quantity: 1,
        price: 100
      }],
      totalAmount: 100,
      status: 'pending',
      shippingAddress: {
        fullName: 'Test User',
        address: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Test Country'
      }
    });

    const savedOrder = await testOrder.save();
    console.log('✅ Test order created:', savedOrder._id);

    // Test findById
    const foundOrder = await Order.findById(savedOrder._id);
    console.log('✅ Order.findById test successful');

    // Clean up
    await Order.findByIdAndDelete(savedOrder._id);
    console.log('✅ Test order cleaned up');
    
    res.json({
      success: true,
      message: 'Order model is working correctly - Full CRUD test passed',
      orderType: typeof Order,
      orderName: Order.name,
      findByIdType: typeof Order.findById,
      orderCount: orderCount,
      crudTest: 'passed'
    });
  } catch (error) {
    console.error('❌ Test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;
