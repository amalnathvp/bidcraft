import Bid from "../models/bid.js";
import Product from "../models/product.js";
import User from "../models/user.js";
import mongoose from "mongoose";

// Get all bids for a specific seller's auctions
export const getSellerBids = async (req, res) => {
    try {
        const sellerId = req.user.id;
        
        const bids = await Bid.find({ sellerId })
            .populate('auctionId', 'itemName itemPhotos')
            .populate('buyerId', 'name email')
            .sort({ bidTime: -1 }); // Newest first
        
        res.status(200).json({ 
            success: true,
            bids,
            total: bids.length 
        });
    } catch (error) {
        console.error("Error fetching seller bids:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error", 
            error: error.message 
        });
    }
};

// Get all bids for a specific auction (for sellers)
export const getAuctionBids = async (req, res) => {
    try {
        const { auctionId } = req.params;
        const sellerId = req.user.id;
        
        // Verify the auction belongs to the seller
        const auction = await Product.findOne({ _id: auctionId, seller: sellerId });
        if (!auction) {
            return res.status(404).json({ 
                success: false,
                message: "Auction not found or you don't have permission to view its bids" 
            });
        }
        
        const bids = await Bid.find({ auctionId })
            .populate('buyerId', 'name email')
            .sort({ bidAmount: -1 }); // Highest bid first
        
        res.status(200).json({ 
            success: true,
            bids,
            total: bids.length,
            auction: {
                _id: auction._id,
                itemName: auction.itemName,
                currentPrice: auction.currentPrice,
                startingPrice: auction.startingPrice
            }
        });
    } catch (error) {
        console.error("Error fetching auction bids:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error", 
            error: error.message 
        });
    }
};

// Get bid statistics for seller dashboard
export const getBidStatistics = async (req, res) => {
    try {
        const sellerId = req.user.id;
        
        const stats = await Bid.aggregate([
            { $match: { sellerId: new mongoose.Types.ObjectId(sellerId) } },
            {
                $group: {
                    _id: null,
                    totalBids: { $sum: 1 },
                    totalBidValue: { $sum: "$bidAmount" },
                    averageBidAmount: { $avg: "$bidAmount" },
                    uniqueBidders: { $addToSet: "$buyerId" }
                }
            },
            {
                $project: {
                    totalBids: 1,
                    totalBidValue: 1,
                    averageBidAmount: { $round: ["$averageBidAmount", 2] },
                    uniqueBidders: { $size: "$uniqueBidders" }
                }
            }
        ]);
        
        const result = stats.length > 0 ? stats[0] : {
            totalBids: 0,
            totalBidValue: 0,
            averageBidAmount: 0,
            uniqueBidders: 0
        };
        
        res.status(200).json({ 
            success: true,
            statistics: result
        });
    } catch (error) {
        console.error("Error fetching bid statistics:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error", 
            error: error.message 
        });
    }
};

// Create a new bid (called when a buyer places a bid)
export const createBid = async (req, res) => {
    try {
        const { auctionId, bidAmount } = req.body;
        const buyerId = req.user.id;
        
        // Get auction and buyer details
        const auction = await Product.findById(auctionId).populate('seller', 'name email');
        const buyer = await User.findById(buyerId);
        
        if (!auction) {
            return res.status(404).json({ 
                success: false,
                message: "Auction not found" 
            });
        }
        
        if (!buyer) {
            return res.status(404).json({ 
                success: false,
                message: "Buyer not found" 
            });
        }
        
        // Create new bid record
        const newBid = new Bid({
            auctionId: auction._id,
            sellerId: auction.seller._id,
            buyerId: buyer._id,
            buyerName: buyer.name,
            buyerEmail: buyer.email,
            bidAmount: bidAmount,
            auctionTitle: auction.itemName
        });
        
        await newBid.save();
        
        // Update previous bids status for this auction
        await Bid.updateMany(
            { 
                auctionId: auction._id, 
                _id: { $ne: newBid._id } 
            },
            { $set: { status: 'outbid' } }
        );
        
        // Set current bid as winning
        newBid.status = 'winning';
        await newBid.save();
        
        res.status(201).json({ 
            success: true,
            message: "Bid placed successfully",
            bid: newBid
        });
    } catch (error) {
        console.error("Error creating bid:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error", 
            error: error.message 
        });
    }
};