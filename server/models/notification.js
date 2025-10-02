import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: [
            'bid_placed',           // User placed a bid
            'outbid',              // User was outbid by someone else
            'auction_won',         // User won an auction
            'auction_lost',        // User lost an auction
            'saved_item_bid',      // Someone bid on user's saved item
            'auction_ending_soon', // Auction ending in 24 hours for items user bid on
            'auction_ended',       // Auction has ended
            'new_bid',            // New bid on auction
            'contact_message'     // Contact message received
        ],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    auction: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: false,
    },
    bidder: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: false,
    },
    bidAmount: {
        type: Number,
        required: false,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        required: false,
    }
}, { timestamps: true });

// Index for efficient queries
notificationSchema.index({ recipient: 1, isDeleted: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;