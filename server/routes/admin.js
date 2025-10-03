import express from "express";
import { getAdminDashboard, getAllUsers, getAllSellers, getAllBuyers } from "../controllers/admin.controller.js";
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

export default adminRouter;