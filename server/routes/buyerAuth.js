import express from "express";
import { 
    buyerSignup, 
    buyerLogin, 
    getBuyerProfile, 
    updateBuyerProfile, 
    buyerLogout 
} from "../controllers/buyerAuth.controller.js";
import { authenticateBuyer } from "../middleware/roleAuth.js";

const router = express.Router();

// Public routes
router.post("/signup", buyerSignup);
router.post("/login", buyerLogin);

// Protected routes (require buyer authentication)
router.get("/profile", authenticateBuyer, getBuyerProfile);
router.put("/profile", authenticateBuyer, updateBuyerProfile);
router.post("/logout", authenticateBuyer, buyerLogout);

export default router;