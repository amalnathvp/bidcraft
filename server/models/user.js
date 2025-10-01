import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    // Basic info (common for all users)
    name: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: function() {
            return this.role === 'buyer';
        }
    },
    lastName: {
        type: String,
        required: function() {
            return this.role === 'buyer';
        }
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
    },
    avatar: {
        type: String,
    },
    role: {
        type: String,
        enum: ['seller', 'buyer', 'admin'],
        default: 'seller',
    },
    
    // Buyer-specific fields
    address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        zipCode: { type: String },
        country: { type: String }
    },
    preferences: {
        categories: [{ type: String }],
        priceRange: { type: String },
        notifications: { type: Boolean, default: true }
    },
    watchlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    
    // System tracking fields
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    location: {
        country: { type: String },
        region: { type: String },
        city: { type: String },
        isp: { type: String }
    },
    signupAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

export default User;