import express from "express";
import { viewAuction, placeBid, getBuyerBids, addToWatchlist, removeFromWatchlist, getWatchlist, getAuctionsBySeller } from "../controllers/buyerAuction.controller.js";
import { authenticateBuyer } from "../middleware/roleAuth.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/view/:id", viewAuction); // View auction details
router.get("/all", viewAuction); // Get all auctions
router.get("/seller/:sellerId", getAuctionsBySeller); // Get auctions by specific seller

// Buyer-only routes (require buyer authentication)
router.post("/bid/:id", authenticateBuyer, placeBid); // Place bid on auction
router.get("/my-bids", authenticateBuyer, getBuyerBids); // Get buyer's bid history
router.post("/watchlist/:id", authenticateBuyer, addToWatchlist); // Add to watchlist
router.delete("/watchlist/:id", authenticateBuyer, removeFromWatchlist); // Remove from watchlist
router.get("/watchlist", authenticateBuyer, getWatchlist); // Get buyer's watchlist

export default router;