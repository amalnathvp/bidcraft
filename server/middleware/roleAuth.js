import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Generic authentication middleware
export const authenticate = (req, res, next) => {
    console.log('=== AUTHENTICATION MIDDLEWARE ===');
    console.log('Cookies:', req.cookies);
    
    const token = req.cookies.auth_token;
    if (!token) {
        console.log('No auth token found');
        return res.status(401).json({ error: "Unauthorized - No token provided" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Token decoded successfully:', { id: decoded.id, role: decoded.role });
        req.user = decoded;
        next();
    } catch (error) {
        console.log('Token verification failed:', error.message);
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

// Seller-only authentication middleware
export const authenticateSeller = (req, res, next) => {
    console.log('=== SELLER AUTHENTICATION MIDDLEWARE ===');
    
    const token = req.cookies.auth_token;
    if (!token) {
        console.log('No auth token found');
        return res.status(401).json({ error: "Unauthorized - Please login as a seller" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Token decoded:', { id: decoded.id, role: decoded.role });
        
        // Check if user has seller role
        if (decoded.role !== 'seller' && decoded.role !== 'user') { // 'user' for backward compatibility
            console.log('Access denied - not a seller');
            return res.status(403).json({ 
                error: "Access denied - Seller privileges required",
                userRole: decoded.role 
            });
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        console.log('Token verification failed:', error.message);
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

// Buyer-only authentication middleware
export const authenticateBuyer = (req, res, next) => {
    console.log('=== BUYER AUTHENTICATION MIDDLEWARE ===');
    
    const token = req.cookies.auth_token;
    if (!token) {
        console.log('No auth token found');
        return res.status(401).json({ error: "Unauthorized - Please login as a buyer" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Token decoded:', { id: decoded.id, role: decoded.role });
        
        // Check if user has buyer role
        if (decoded.role !== 'buyer') {
            console.log('Access denied - not a buyer');
            return res.status(403).json({ 
                error: "Access denied - Buyer privileges required",
                userRole: decoded.role 
            });
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        console.log('Token verification failed:', error.message);
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

// Admin-only authentication middleware
export const authenticateAdmin = (req, res, next) => {
    console.log('=== ADMIN AUTHENTICATION MIDDLEWARE ===');
    
    const token = req.cookies.auth_token;
    if (!token) {
        console.log('No auth token found');
        return res.status(401).json({ error: "Unauthorized - Admin access required" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Token decoded:', { id: decoded.id, role: decoded.role });
        
        // Check if user has admin role
        if (decoded.role !== 'admin') {
            console.log('Access denied - not an admin');
            return res.status(403).json({ 
                error: "Access denied - Admin privileges required",
                userRole: decoded.role 
            });
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        console.log('Token verification failed:', error.message);
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

// Legacy middleware for backward compatibility
export const secureRoute = authenticate;