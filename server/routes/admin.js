import express from "express";
import { 
    getAdminDashboard, 
    getAllUsers, 
    getAllSellers, 
    getAllBuyers,
    getPendingAuctions,
    approveAuction,
    rejectAuction,
    getAllAuctions,
    migrateExistingAuctions
} from "../controllers/admin.controller.js";
const adminRouter = express.Router();

// Verify admin authentication status (already protected by authenticateAdmin in index.js)
adminRouter.get('/verify', (req, res) => {
    console.log('Admin verify endpoint hit');
    console.log('Request user:', req.user);
    
    res.json({ message: "Admin authenticated", user: req.user });
});

// All routes are already protected by authenticateAdmin middleware in index.js
adminRouter.get('/dashboard', getAdminDashboard);
adminRouter.get('/users', getAllUsers);
adminRouter.get('/sellers', getAllSellers);
adminRouter.get('/buyers', getAllBuyers);

// Auction approval routes
adminRouter.get('/auctions/pending', getPendingAuctions);
adminRouter.get('/auctions', getAllAuctions);
adminRouter.put('/auctions/:auctionId/approve', approveAuction);
adminRouter.put('/auctions/:auctionId/reject', rejectAuction);

// Migration route
adminRouter.post('/migrate-auctions', migrateExistingAuctions);

export default adminRouter;