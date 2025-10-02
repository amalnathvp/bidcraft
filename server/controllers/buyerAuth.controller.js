import User from "../models/user.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt.js";
import { getLocationFromIp, getClientIp } from "../utils/geoDetails.js";

// Buyer Signup
export const buyerSignup = async (req, res) => {
    try {
        const { 
            firstName, 
            lastName, 
            email, 
            password, 
            phone, 
            address, 
            preferences 
        } = req.body;

        // Check if buyer already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                message: "A user with this email already exists" 
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Get user's location and IP info
        const ipAddress = getClientIp(req);
        const userAgent = req.get('User-Agent');
        const location = await getLocationFromIp(ipAddress);

        // Create new buyer
        const newBuyer = new User({
            firstName,
            lastName,
            name: `${firstName} ${lastName}`, // Maintain compatibility
            email,
            password: hashedPassword,
            phone,
            role: 'buyer',
            address: address || {},
            preferences: {
                categories: preferences?.categories || [],
                priceRange: preferences?.priceRange || '',
                notifications: preferences?.notifications !== undefined ? preferences.notifications : true
            },
            ipAddress,
            userAgent,
            location,
            signupAt: new Date(),
            lastLogin: new Date()
        });

        await newBuyer.save();

        // Generate JWT token
        const token = generateToken(newBuyer._id, newBuyer.role);

        // Set HTTP-only cookie
        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // Remove password from response
        const buyerResponse = newBuyer.toObject();
        delete buyerResponse.password;

        res.status(201).json({
            message: "Buyer account created successfully",
            buyer: buyerResponse,
            success: true
        });

    } catch (error) {
        console.error("Buyer signup error:", error);
        res.status(500).json({ 
            message: "Server error during signup", 
            error: error.message 
        });
    }
};

// Buyer Login
export const buyerLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find buyer by email
        const buyer = await User.findOne({ email, role: 'buyer' });
        if (!buyer) {
            return res.status(400).json({ 
                message: "Invalid email or password" 
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, buyer.password);
        if (!isPasswordValid) {
            return res.status(400).json({ 
                message: "Invalid email or password" 
            });
        }

        // Update last login
        buyer.lastLogin = new Date();
        await buyer.save();

        // Generate JWT token
        const token = generateToken(buyer._id, buyer.role);

        // Set HTTP-only cookie
        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // Remove password from response
        const buyerResponse = buyer.toObject();
        delete buyerResponse.password;

        res.status(200).json({
            message: "Login successful",
            buyer: buyerResponse,
            success: true
        });

    } catch (error) {
        console.error("Buyer login error:", error);
        res.status(500).json({ 
            message: "Server error during login", 
            error: error.message 
        });
    }
};

// Get Buyer Profile
export const getBuyerProfile = async (req, res) => {
    try {
        const buyer = await User.findById(req.user.id).select('-password');
        
        if (!buyer || buyer.role !== 'buyer') {
            return res.status(404).json({ 
                message: "Buyer not found" 
            });
        }

        res.status(200).json({
            buyer
        });

    } catch (error) {
        console.error("Get buyer profile error:", error);
        res.status(500).json({ 
            message: "Server error", 
            error: error.message 
        });
    }
};

// Update Buyer Profile
export const updateBuyerProfile = async (req, res) => {
    try {
        const { 
            firstName, 
            lastName, 
            phone, 
            address, 
            preferences 
        } = req.body;

        const buyer = await User.findById(req.user.id);
        
        if (!buyer || buyer.role !== 'buyer') {
            return res.status(404).json({ 
                message: "Buyer not found" 
            });
        }

        // Update fields
        if (firstName) buyer.firstName = firstName;
        if (lastName) buyer.lastName = lastName;
        if (firstName || lastName) {
            buyer.name = `${buyer.firstName} ${buyer.lastName}`;
        }
        if (phone) buyer.phone = phone;
        if (address) buyer.address = { ...buyer.address, ...address };
        if (preferences) buyer.preferences = { ...buyer.preferences, ...preferences };

        await buyer.save();

        // Remove password from response
        const buyerResponse = buyer.toObject();
        delete buyerResponse.password;

        res.status(200).json({
            message: "Profile updated successfully",
            buyer: buyerResponse
        });

    } catch (error) {
        console.error("Update buyer profile error:", error);
        res.status(500).json({ 
            message: "Server error", 
            error: error.message 
        });
    }
};

// Change Buyer Password
export const changeBuyerPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                message: "Current password and new password are required" 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                message: "New password must be at least 6 characters long" 
            });
        }

        const buyer = await User.findById(req.user.id);
        
        if (!buyer || buyer.role !== 'buyer') {
            return res.status(404).json({ 
                message: "Buyer not found" 
            });
        }

        // Check current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, buyer.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ 
                message: "Current password is incorrect" 
            });
        }

        // Hash new password
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        buyer.password = hashedNewPassword;
        await buyer.save();

        res.status(200).json({
            message: "Password changed successfully"
        });

    } catch (error) {
        console.error("Change buyer password error:", error);
        res.status(500).json({ 
            message: "Server error", 
            error: error.message 
        });
    }
};

// Buyer Logout
export const buyerLogout = async (req, res) => {
    try {
        // Clear the auth token cookie
        res.clearCookie("auth_token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });
        
        res.status(200).json({
            message: "Logged out successfully",
            success: true
        });
    } catch (error) {
        console.error("Buyer logout error:", error);
        res.status(500).json({ 
            message: "Server error", 
            error: error.message 
        });
    }
};