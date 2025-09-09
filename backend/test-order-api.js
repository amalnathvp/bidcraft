const express = require('express');
const mongoose = require('mongoose');
const Order = require('./src/models/Order');

async function testOrderModel() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://127.0.0.1:27017/bidcraft');
    console.log('MongoDB connected');

    // Test Order model directly
    console.log('Order model:', Order);
    console.log('Order.findById:', typeof Order.findById);

    // Create a test order first if none exists
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
    console.log('Test order created:', savedOrder._id);

    // Now test findById
    const foundOrder = await Order.findById(savedOrder._id);
    console.log('Found order:', foundOrder ? 'Success' : 'Failed');

    // Clean up
    await Order.findByIdAndDelete(savedOrder._id);
    console.log('Test order cleaned up');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testOrderModel();
