import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['bid_placed', 'auction_won', 'auction_ended', 'new_bid'],
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
    }
}, { timestamps: true });

// Index for efficient queries
notificationSchema.index({ recipient: 1, isDeleted: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;