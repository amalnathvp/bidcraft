import Product from "../models/product.js";
import User from "../models/user.js";
import { createNotification } from "./notification.controller.js";

// View auction details (public - no auth required)
export const viewAuction = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (id) {
            // Get specific auction
            const auction = await Product.findById(id).populate('seller', 'name email');
            if (!auction) {
                return res.status(404).json({ message: "Auction not found" });
            }
            res.status(200).json({ auction });
        } else {
            // Get all active auctions
            const auctions = await Product.find({
                itemEndDate: { $gt: new Date() } // Only active auctions
            }).populate('seller', 'name email').sort({ createdAt: -1 });
            
            res.status(200).json({ auctions });
        }
    } catch (error) {
        console.error("View auction error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Place bid on auction (buyer only)
export const placeBid = async (req, res) => {
    try {
        const { id } = req.params; // auction id
        const { bidAmount } = req.body;
        const buyerId = req.user.id;

        // Validate bid amount
        if (!bidAmount || bidAmount <= 0) {
            return res.status(400).json({ message: "Invalid bid amount" });
        }

        // Find the auction
        const auction = await Product.findById(id);
        if (!auction) {
            return res.status(404).json({ message: "Auction not found" });
        }

        // Check if auction is still active
        if (new Date(auction.itemEndDate) <= new Date()) {
            return res.status(400).json({ message: "Auction has ended" });
        }

        // Check if bid is higher than current price
        const currentPrice = auction.currentPrice > 0 ? auction.currentPrice : auction.startingPrice;
        if (bidAmount <= currentPrice) {
            return res.status(400).json({ 
                message: `Bid must be higher than current price of $${currentPrice}` 
            });
        }

        // Check if buyer is not the seller
        if (auction.seller.toString() === buyerId) {
            return res.status(400).json({ message: "Sellers cannot bid on their own auctions" });
        }

        // Update auction with new bid
        auction.currentPrice = bidAmount;
        auction.highestBidder = buyerId;
        auction.bidCount = (auction.bidCount || 0) + 1;
        auction.bidHistory = auction.bidHistory || [];
        auction.bidHistory.push({
            bidder: buyerId,
            amount: bidAmount,
            timestamp: new Date()
        });

        await auction.save();

        // Get buyer info for response
        const buyer = await User.findById(buyerId).select('name email firstName lastName');

        // Create notification for seller
        try {
            await createNotification({
                recipient: auction.seller,
                type: 'new_bid',
                title: 'New Bid Received',
                message: `${buyer.firstName || buyer.name} placed a bid of $${bidAmount} on your auction "${auction.itemName}"`,
                auction: auction._id,
                bidder: buyerId,
                bidAmount: bidAmount
            });
        } catch (notificationError) {
            console.error('Failed to create notification:', notificationError);
            // Don't fail the bid if notification creation fails
        }

        res.status(200).json({
            message: "Bid placed successfully",
            auction: {
                _id: auction._id,
                itemName: auction.itemName,
                currentPrice: auction.currentPrice,
                highestBidder: auction.highestBidder
            },
            bidDetails: {
                amount: bidAmount,
                bidder: buyer,
                timestamp: new Date()
            }
        });

    } catch (error) {
        console.error("Place bid error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get buyer's bid history
export const getBuyerBids = async (req, res) => {
    try {
        const buyerId = req.user.id;

        // Find all auctions where this buyer has placed bids
        const auctions = await Product.find({
            "bidHistory.bidder": buyerId
        }).populate('seller', 'name email').sort({ updatedAt: -1 });

        // Filter and format bid history for this buyer
        const buyerBids = auctions.map(auction => {
            const buyerBidsInAuction = auction.bidHistory.filter(
                bid => bid.bidder.toString() === buyerId
            );
            
            return {
                auction: {
                    _id: auction._id,
                    itemName: auction.itemName,
                    itemPhotos: auction.itemPhotos || [auction.itemPhoto],
                    currentPrice: auction.currentPrice,
                    endDate: auction.itemEndDate,
                    isActive: new Date(auction.itemEndDate) > new Date(),
                    seller: auction.seller
                },
                bids: buyerBidsInAuction,
                isWinning: auction.highestBidder?.toString() === buyerId
            };
        });

        res.status(200).json({ buyerBids });
    } catch (error) {
        console.error("Get buyer bids error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Add auction to watchlist
export const addToWatchlist = async (req, res) => {
    try {
        const { id } = req.params; // auction id
        const buyerId = req.user.id;

        // Check if auction exists
        const auction = await Product.findById(id);
        if (!auction) {
            return res.status(404).json({ message: "Auction not found" });
        }

        // Update buyer's watchlist
        const buyer = await User.findById(buyerId);
        if (!buyer.watchlist) {
            buyer.watchlist = [];
        }

        // Check if already in watchlist
        if (buyer.watchlist.includes(id)) {
            return res.status(400).json({ message: "Auction already in watchlist" });
        }

        buyer.watchlist.push(id);
        await buyer.save();

        res.status(200).json({ 
            message: "Added to watchlist successfully",
            watchlistCount: buyer.watchlist.length 
        });
    } catch (error) {
        console.error("Add to watchlist error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Remove auction from watchlist
export const removeFromWatchlist = async (req, res) => {
    try {
        const { id } = req.params; // auction id
        const buyerId = req.user.id;

        // Update buyer's watchlist
        const buyer = await User.findById(buyerId);
        if (!buyer.watchlist) {
            return res.status(400).json({ message: "Watchlist is empty" });
        }

        // Remove from watchlist
        buyer.watchlist = buyer.watchlist.filter(auctionId => auctionId.toString() !== id);
        await buyer.save();

        res.status(200).json({ 
            message: "Removed from watchlist successfully",
            watchlistCount: buyer.watchlist.length 
        });
    } catch (error) {
        console.error("Remove from watchlist error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get buyer's watchlist
export const getWatchlist = async (req, res) => {
    try {
        const buyerId = req.user.id;

        // Get buyer with populated watchlist
        const buyer = await User.findById(buyerId).populate({
            path: 'watchlist',
            populate: {
                path: 'seller',
                select: 'name email'
            }
        });

        if (!buyer.watchlist) {
            return res.status(200).json({ watchlist: [] });
        }

        // Format watchlist data
        const watchlist = buyer.watchlist.map(auction => ({
            _id: auction._id,
            itemName: auction.itemName,
            itemPhotos: auction.itemPhotos || [auction.itemPhoto],
            currentPrice: auction.currentPrice || auction.startingPrice,
            endDate: auction.itemEndDate,
            isActive: new Date(auction.itemEndDate) > new Date(),
            seller: auction.seller
        }));

        res.status(200).json({ watchlist });
    } catch (error) {
        console.error("Get watchlist error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};