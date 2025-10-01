import Login from "../models/Login.js";
import User from "../models/user.js";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { connectDB } from '../connection.js'


export const handleGetUser = async (req, res) => {
    try {
        await connectDB();
        const user = await User.findById(req.user.id).select("name email avatar role");

        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({ user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
}

export const handleChangePassword = async (req, res) => {
    try {
        await connectDB();
        const { currentPassword, newPassword, confirmPassword } = req.body;
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ error: "Please enter all fields" });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: "New password and confirm password do not match." });
        }
        if (currentPassword === newPassword) {
            return res.status(400).json({ error: "You can't reuse the old password." });
        }

        const userID = req.user.id;

        const user = await User.findById(userID);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Current password is incorrect." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        await user.save();

        return res.status(200).json({ message: "Password changed successfully." });
    } catch (err) {
        console.error("Error changing password:", err);
        return res.status(500).json({ error: "Something went wrong. Please try again later." });
    }
};

// Get Seller Profile
export const getSellerProfile = async (req, res) => {
    try {
        await connectDB();
        const userId = req.user.id;

        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Calculate profile completion percentage
        const profileFields = [
            user.name, user.email, user.phone, user.businessName, 
            user.businessType, user.businessAddress, user.city, 
            user.state, user.country, user.description, user.avatar
        ];
        
        const completedFields = profileFields.filter(field => field && field.toString().trim()).length;
        const completionPercentage = Math.round((completedFields / profileFields.length) * 100);

        // Get seller statistics (you can expand this based on your auction model)
        const stats = {
            totalAuctions: 0, // You'll need to count from your auction model
            activeAuctions: 0,
            completedAuctions: 0,
            totalRevenue: 0,
            avgRating: 0,
            totalReviews: 0
        };

        res.status(200).json({
            success: true,
            user: {
                ...user.toObject(),
                completionPercentage,
                stats
            }
        });

    } catch (error) {
        console.error("Error fetching seller profile:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching profile",
            error: error.message
        });
    }
};

// Update Seller Profile
export const updateSellerProfile = async (req, res) => {
    try {
        await connectDB();
        const userId = req.user.id;
        const {
            name,
            email,
            phone,
            businessName,
            businessType,
            businessAddress,
            city,
            state,
            zipCode,
            country,
            taxId,
            website,
            description,
            socialMedia,
            avatar
        } = req.body;

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }

        // Validate email uniqueness if changed
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email, _id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "Email already exists"
                });
            }
        }

        // Update user fields
        const updateData = {
            name: name || user.name,
            email: email || user.email,
            phone: phone || user.phone,
            businessName: businessName || user.businessName,
            businessType: businessType || user.businessType,
            businessAddress: businessAddress || user.businessAddress,
            city: city || user.city,
            state: state || user.state,
            zipCode: zipCode || user.zipCode,
            country: country || user.country,
            taxId: taxId || user.taxId,
            website: website || user.website,
            description: description || user.description,
            avatar: avatar || user.avatar,
            updatedAt: new Date()
        };

        // Handle social media object
        if (socialMedia !== undefined) {
            updateData.socialMedia = {
                facebook: socialMedia.facebook || user.socialMedia?.facebook || '',
                twitter: socialMedia.twitter || user.socialMedia?.twitter || '',
                instagram: socialMedia.instagram || user.socialMedia?.instagram || ''
            };
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select("-password");

        // Calculate new completion percentage
        const profileFields = [
            updatedUser.name, updatedUser.email, updatedUser.phone, 
            updatedUser.businessName, updatedUser.businessType, 
            updatedUser.businessAddress, updatedUser.city, 
            updatedUser.state, updatedUser.country, updatedUser.description, 
            updatedUser.avatar
        ];
        
        const completedFields = profileFields.filter(field => field && field.toString().trim()).length;
        const completionPercentage = Math.round((completedFields / profileFields.length) * 100);

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                ...updatedUser.toObject(),
                completionPercentage
            }
        });

    } catch (error) {
        console.error("Error updating seller profile:", error);
        res.status(500).json({
            success: false,
            message: "Error updating profile",
            error: error.message
        });
    }
};

// Upload Profile Image
export const uploadProfileImage = async (req, res) => {
    try {
        await connectDB();
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image file provided"
            });
        }

        // Update user avatar with the uploaded image URL
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { avatar: req.file.path }, // Cloudinary URL
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Profile image updated successfully",
            avatar: req.file.path
        });

    } catch (error) {
        console.error("Error uploading profile image:", error);
        res.status(500).json({
            success: false,
            message: "Error uploading image",
            error: error.message
        });
    }
};

export const getLoginHistory = async (req, res) => {
    try {
        await connectDB();
        const userId = req.user.id;

        const logins = await Login.aggregate([
            {
                $match: { userId: new mongoose.Types.ObjectId(userId) }
            },
            {
                $sort: { loginAt: -1 }
            },
            {
                $limit: 10
            }
        ]);

        const formatted = logins.map(login => {
            const date = new Date(login.loginAt);
            const formattedDate = date.toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            });

            const location = [
                login.location?.city,
                login.location?.region,
                login.location?.country
            ].filter(Boolean).join(", ");

            return {
                id: login._id,
                dateTime: formattedDate,
                ipAddress: login.ipAddress || "Unknown",
                location: location || "Unknown",
                isp: login.location?.isp || "Unknown",
                device: getDeviceType(login.userAgent),
            };
        });

        res.status(200).json(formatted);

    } catch (error) {
        console.error("Error fetching login history:", error);
        res.status(500).json({
            success: false,
            message: "Could not fetch login logs"
        });
    }
};


function getDeviceType(userAgent = "") {
    userAgent = userAgent.toLowerCase();
    if (/mobile|iphone|ipod|android.*mobile|windows phone/.test(userAgent)) return "Mobile";
    if (/tablet|ipad|android(?!.*mobile)/.test(userAgent)) return "Tablet";
    return "Desktop";
}