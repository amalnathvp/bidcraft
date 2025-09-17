import express from "express";
import { 
    buyerSignup, 
    buyerLogin, 
    getBuyerProfile, 
    updateBuyerProfile, 
    buyerLogout 
} from "../controllers/buyerAuth.controller.js";
import { secureRoute } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/signup", buyerSignup);
router.post("/login", buyerLogin);

// Protected routes (require authentication)
router.get("/profile", secureRoute, getBuyerProfile);
router.put("/profile", secureRoute, updateBuyerProfile);
router.post("/logout", secureRoute, buyerLogout);

export default router;