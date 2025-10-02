import express from "express";
import { 
    getSellerBids, 
    getAuctionBids, 
    getBidStatistics, 
    createBid,
    getBuyerBids,
    deleteBuyerBid,
    getBuyerBidStatistics
} from "../controllers/bid.controller.js";
import { authenticateSeller, authenticateBuyer } from "../middleware/roleAuth.js";

const router = express.Router();

// Seller routes - require seller authentication
router.get("/seller/all", authenticateSeller, getSellerBids); // Get all bids for seller's auctions
router.get("/seller/auction/:auctionId", authenticateSeller, getAuctionBids); // Get bids for specific auction
router.get("/seller/statistics", authenticateSeller, getBidStatistics); // Get bid statistics for dashboard

// Buyer routes - require buyer authentication
router.get("/buyer", authenticateBuyer, getBuyerBids); // Get all bids placed by buyer
router.delete("/:bidId", authenticateBuyer, deleteBuyerBid); // Delete/withdraw a bid
router.get("/buyer/statistics", authenticateBuyer, getBuyerBidStatistics); // Get buyer bid statistics

// Create bid route (will be called from auction bidding)
router.post("/create", createBid); // This will be called internally when bids are placed

export default router;