import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema({
    auctionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    buyerName: {
        type: String,
        required: true
    },
    buyerEmail: {
        type: String,
        required: true
    },
    bidAmount: {
        type: Number,
        required: true
    },
    bidTime: {
        type: Date,
        default: Date.now
    },
    auctionTitle: {
        type: String,
        required: true
    },
    isWinningBid: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['active', 'outbid', 'winning', 'won', 'lost'],
        default: 'active'
    }
}, { 
    timestamps: true 
});

// Create indexes for better query performance
bidSchema.index({ sellerId: 1, bidTime: -1 });
bidSchema.index({ auctionId: 1, bidAmount: -1 });
bidSchema.index({ buyerId: 1, bidTime: -1 });

const Bid = mongoose.model('Bid', bidSchema);
export default Bid;