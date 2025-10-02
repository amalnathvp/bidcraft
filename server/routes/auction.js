import express from 'express';
import { createAuction, showAuction, auctionById, placeBid, dashboardData, myAuction, updateAuction, deleteAuction } from '../controllers/auction.controller.js';
import { authenticateSeller } from '../middleware/roleAuth.js';
import upload from '../middleware/multer.js';

const auctionRouter = express.Router();

// Seller-only routes (authentication required) - specific routes first
auctionRouter.get('/stats', authenticateSeller, dashboardData);
auctionRouter.get('/myauction', authenticateSeller, myAuction);
auctionRouter.get('/', authenticateSeller, showAuction);
auctionRouter.post('/', authenticateSeller, upload.array('itemPhotos', 5), createAuction);

// Dynamic routes with authentication for actions
auctionRouter.post('/:id', authenticateSeller, placeBid);
auctionRouter.put('/:id', authenticateSeller, upload.array('itemPhotos', 5), updateAuction);
auctionRouter.delete('/:id', authenticateSeller, deleteAuction);

// Public routes (no authentication required) - put at the end
auctionRouter.get('/:id', auctionById); // Allow public viewing of auction details

export default auctionRouter;