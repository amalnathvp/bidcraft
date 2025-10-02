import Bid from "../models/bid.js";
import Product from "../models/product.js";
import User from "../models/user.js";
import mongoose from "mongoose";

// Get all bids placed by a buyer
export const getBuyerBids = async (req, res) => {
    try {
        const buyerId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50); // Limit max to prevent abuse
        const status = req.query.status;
        
        const skip = (page - 1) * limit;
        
        // Build match query
        let matchQuery = { buyerId: new mongoose.Types.ObjectId(buyerId) };
        
        // If status filter is provided, add it to the query
        if (status && status !== 'all') {
            if (['winning', 'outbid', 'won', 'lost'].includes(status)) {
                matchQuery.status = status;
            }
        }
        
        // Optimized aggregation with better pipeline order and selective fields
        const pipeline = [
            { $match: matchQuery },
            { $sort: { bidTime: -1 } }, // Sort early to optimize skip/limit
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'products',
                    localField: 'auctionId',
                    foreignField: '_id',
                    as: 'auction',
                    pipeline: [ // Use sub-pipeline to select only needed fields
                        {
                            $project: {
                                itemName: 1,
                                itemCategory: 1,
                                itemDescription: 1,
                                itemPhotos: 1,
                                itemPhoto: 1,
                                startingPrice: 1,
                                currentPrice: 1,
                                itemEndDate: 1,
                                bidCount: 1,
                                sellerId: 1
                            }
                        }
                    ]
                }
            },
            { $unwind: { path: '$auction', preserveNullAndEmptyArrays: false } }, // Skip bids without auctions
            {
                $addFields: {
                    isWinning: {
                        $cond: {
                            if: { $gte: [new Date(), '$auction.itemEndDate'] },
                            then: { $eq: ['$status', 'won'] },
                            else: { $eq: ['$status', 'winning'] }
                        }
                    }
                }
            }
        ];
        
        // Execute aggregation and count in parallel for better performance
        const [bids, totalBids] = await Promise.all([
            Bid.aggregate(pipeline),
            Bid.countDocuments(matchQuery)
        ]);
        
        const totalPages = Math.ceil(totalBids / limit);
        
        res.status(200).json({
            success: true,
            bids,
            totalBids,
            totalPages,
            currentPage: page,
            pagination: {
                currentPage: page,
                totalPages,
                totalBids,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error("Error fetching buyer bids:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// Delete/withdraw a bid (only if auction is still active and bid is not winning)
export const deleteBuyerBid = async (req, res) => {
    try {
        console.log('=== DELETE BUYER BID REQUEST RECEIVED ===');
        console.log('Request URL:', req.originalUrl);
        console.log('Request Method:', req.method);
        console.log('Request Params:', req.params);
        console.log('Request Headers:', req.headers);
        console.log('Request Body:', req.body);
        console.log('User from middleware:', req.user);
        console.log('Bid ID:', req.params.bidId);
        console.log('Buyer ID:', req.user.id);
        
        const { bidId } = req.params;
        const buyerId = req.user.id;
        
        // Validate bidId format
        if (!mongoose.Types.ObjectId.isValid(bidId)) {
            console.log('Invalid bid ID format');
            return res.status(400).json({
                success: false,
                message: "Invalid bid ID format"
            });
        }
        
        // Find the bid and populate the auction (Product model)
        const bid = await Bid.findOne({ 
            _id: bidId, 
            buyerId: new mongoose.Types.ObjectId(buyerId) 
        }).populate({
            path: 'auctionId',
            model: 'Product'
        });
        
        console.log('Found bid:', bid ? 'Yes' : 'No');
        
        if (!bid) {
            console.log('Bid not found or permission denied');
            return res.status(404).json({
                success: false,
                message: "Bid not found or you don't have permission to delete it"
            });
        }
        
        console.log('Auction data:', bid.auctionId ? 'Found' : 'Missing');
        console.log('Auction end date:', bid.auctionId?.itemEndDate);
        console.log('Bid status:', bid.status);
        
        // Check if auction exists
        if (!bid.auctionId) {
            console.log('Auction data not found');
            return res.status(400).json({
                success: false,
                message: "Associated auction not found"
            });
        }
        
        // Check if auction is still active
        const now = new Date();
        const auctionEndDate = new Date(bid.auctionId.itemEndDate);
        
        console.log('Current time:', now);
        console.log('Auction end time:', auctionEndDate);
        console.log('Is auction ended:', auctionEndDate <= now);
        
        if (auctionEndDate <= now) {
            console.log('Cannot withdraw bid - auction ended');
            return res.status(400).json({
                success: false,
                message: "Cannot withdraw bid from ended auction"
            });
        }
        
        // Check if this is the current winning bid
        if (bid.status === 'winning') {
            console.log('Cannot withdraw winning bid');
            return res.status(400).json({
                success: false,
                message: "Cannot withdraw the current winning bid. You can only withdraw if you've been outbid."
            });
        }
        
        // Delete the bid
        console.log('Deleting bid...');
        await Bid.findByIdAndDelete(bidId);
        console.log('Bid deleted successfully');
        
        res.status(200).json({
            success: true,
            message: "Bid withdrawn successfully"
        });
    } catch (error) {
        console.error("Error deleting buyer bid:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// Get buyer bid statistics
export const getBuyerBidStatistics = async (req, res) => {
    try {
        const buyerId = req.user.id;
        
        const stats = await Bid.aggregate([
            { $match: { buyerId: new mongoose.Types.ObjectId(buyerId) } },
            {
                $lookup: {
                    from: 'auctions',
                    localField: 'auctionId',
                    foreignField: '_id',
                    as: 'auction'
                }
            },
            { $unwind: '$auction' },
            {
                $group: {
                    _id: null,
                    totalBids: { $sum: 1 },
                    totalBidValue: { $sum: '$bidAmount' },
                    averageBidAmount: { $avg: '$bidAmount' },
                    maxBidAmount: { $max: '$bidAmount' },
                    winningBids: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'winning'] }, 1, 0]
                        }
                    },
                    wonAuctions: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'won'] }, 1, 0]
                        }
                    },
                    outbidBids: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'outbid'] }, 1, 0]
                        }
                    },
                    lostAuctions: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'lost'] }, 1, 0]
                        }
                    }
                }
            },
            {
                $project: {
                    totalBids: 1,
                    totalBidValue: 1,
                    averageBidAmount: { $round: ['$averageBidAmount', 2] },
                    maxBidAmount: 1,
                    winningBids: 1,
                    wonAuctions: 1,
                    outbidBids: 1,
                    lostAuctions: 1,
                    successRate: {
                        $round: [
                            {
                                $multiply: [
                                    { $divide: ['$wonAuctions', '$totalBids'] },
                                    100
                                ]
                            },
                            2
                        ]
                    }
                }
            }
        ]);
        
        const result = stats.length > 0 ? stats[0] : {
            totalBids: 0,
            totalBidValue: 0,
            averageBidAmount: 0,
            maxBidAmount: 0,
            winningBids: 0,
            wonAuctions: 0,
            outbidBids: 0,
            lostAuctions: 0,
            successRate: 0
        };
        
        res.status(200).json({
            success: true,
            statistics: result
        });
    } catch (error) {
        console.error("Error fetching buyer bid statistics:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

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