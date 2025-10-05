import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    default: () => 'ORD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase()
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  auction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itemDetails: {
    itemName: { type: String, required: true },
    itemDescription: String,
    itemCategory: String,
    itemPhotos: [String],
    itemPhoto: String
  },
  pricing: {
    purchasePrice: { type: Number, required: true },
    tax: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true }
  },
  deliveryAddress: {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'United States' }
  },
  paymentDetails: {
    paymentMethod: { type: String, required: true }, // 'card' or 'paypal'
    transactionId: String,
    paymentStatus: { 
      type: String, 
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'completed'
    }
  },
  orderStatus: {
    type: String,
    enum: ['processing', 'confirmed', 'shipped', 'in_transit', 'delivered', 'cancelled'],
    default: 'processing'
  },
  deliveryStatus: {
    type: String,
    enum: ['processing', 'confirmed', 'shipped', 'in_transit', 'delivered', 'cancelled'],
    default: 'processing'
  },
  tracking: {
    trackingNumber: String,
    carrier: String,
    estimatedDelivery: Date,
    actualDelivery: Date
  },
  orderDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
orderSchema.index({ buyer: 1, orderDate: -1 });
orderSchema.index({ seller: 1, orderDate: -1 });
orderSchema.index({ orderId: 1 });

export default mongoose.model('Order', orderSchema);