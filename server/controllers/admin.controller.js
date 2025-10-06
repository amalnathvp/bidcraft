import Product from '../models/product.js';
import User from '../models/user.js';
import { connectDB } from '../connection.js';

export const getAdminDashboard = async (req, res) => {
    try {
        await connectDB();
        
        // Get overall statistics
        const totalAuctions = await Product.countDocuments();
        const activeAuctions = await Product.countDocuments({ itemEndDate: { $gt: new Date() } });
        const endedAuctions = await Product.countDocuments({ itemEndDate: { $lte: new Date() } });
        
        // Get user statistics broken down by role
        const totalUsers = await User.countDocuments();
        const totalSellers = await User.countDocuments({ role: 'seller' });
        const totalBuyers = await User.countDocuments({ role: 'buyer' });
        const totalAdmins = await User.countDocuments({ role: 'admin' });
        
        // Get recent users (last 7 days)
        const recentUsers = await User.countDocuments({ 
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
        });
        const recentSellers = await User.countDocuments({ 
            role: 'seller',
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
        });
        const recentBuyers = await User.countDocuments({ 
            role: 'buyer',
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
        });
        
        // Get auction statistics
        const auctionsToday = await Product.countDocuments({
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        });
        
        // Get recent active auctions for display
        const recentActiveAuctions = await Product.find({ itemEndDate: { $gt: new Date() } })
            .populate('seller', 'name email')
            .sort({ createdAt: -1 })
            .limit(6);
            
        // Get recent users for display
        const recentUsersList = await User.find({})
            .select('name email role createdAt lastLogin location avatar')
            .sort({ createdAt: -1 })
            .limit(10);

        // Get top sellers by auction count
        const topSellers = await Product.aggregate([
            { $group: { _id: '$seller', auctionCount: { $sum: 1 } } },
            { $sort: { auctionCount: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'sellerInfo'
                }
            },
            { $unwind: '$sellerInfo' },
            {
                $project: {
                    name: '$sellerInfo.name',
                    email: '$sellerInfo.email',
                    auctionCount: 1
                }
            }
        ]);

        // Calculate auction success rate
        const successfulAuctions = await Product.countDocuments({
            itemEndDate: { $lte: new Date() },
            'bidHistory.0': { $exists: true } // Has at least one bid
        });
        const successRate = endedAuctions > 0 ? ((successfulAuctions / endedAuctions) * 100).toFixed(1) : 0;
            
        res.status(200).json({
            stats: {
                // Overall statistics
                activeAuctions,
                totalAuctions,
                endedAuctions,
                auctionsToday,
                successRate,
                
                // User statistics
                totalUsers,
                totalSellers,
                totalBuyers,
                totalAdmins,
                
                // Recent statistics (last 7 days)
                recentUsers,
                recentSellers,
                recentBuyers
            },
            recentAuctions: recentActiveAuctions,
            recentUsersList: recentUsersList,
            topSellers: topSellers
        });
    } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        res.status(500).json({ message: 'Error fetching admin dashboard data', error: error.message });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        await connectDB();
        
        // Get pagination parameters from query string
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        
        // Calculate skip value for pagination
        const skip = (page - 1) * limit;
        
        // Build search query
        const searchQuery = search ? {
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        } : {};
        
        // Get total count for pagination info
        const totalUsers = await User.countDocuments(searchQuery);
        
        // Get users with pagination, search, and sorting
        const users = await User.find(searchQuery)
            .select('name email role createdAt signupAt lastLogin location avatar')
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit)
            .lean();
        
        // Calculate pagination info
        const totalPages = Math.ceil(totalUsers / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        
        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalUsers,
                    limit,
                    hasNextPage,
                    hasPrevPage
                }
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching users', 
            error: error.message 
        });
    }
};

// Get all sellers with pagination and filtering
export const getAllSellers = async (req, res) => {
    try {
        await connectDB();
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        
        const skip = (page - 1) * limit;
        
        // Build search query for sellers only
        const searchQuery = {
            role: 'seller',
            ...(search && {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            })
        };
        
        const totalSellers = await User.countDocuments(searchQuery);
        
        // Get sellers with their auction statistics
        const sellers = await User.aggregate([
            { $match: searchQuery },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: 'seller',
                    as: 'auctions'
                }
            },
            {
                $addFields: {
                    totalAuctions: { $size: '$auctions' },
                    activeAuctions: {
                        $size: {
                            $filter: {
                                input: '$auctions',
                                cond: { $gt: ['$$this.itemEndDate', new Date()] }
                            }
                        }
                    },
                    completedAuctions: {
                        $size: {
                            $filter: {
                                input: '$auctions',
                                cond: { $lte: ['$$this.itemEndDate', new Date()] }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    role: 1,
                    createdAt: 1,
                    lastLogin: 1,
                    location: 1,
                    avatar: 1,
                    totalAuctions: 1,
                    activeAuctions: 1,
                    completedAuctions: 1
                }
            },
            { $sort: { [sortBy]: sortOrder } },
            { $skip: skip },
            { $limit: limit }
        ]);
        
        const totalPages = Math.ceil(totalSellers / limit);
        
        res.status(200).json({
            success: true,
            data: {
                sellers,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalSellers,
                    limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Error fetching sellers:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching sellers', 
            error: error.message 
        });
    }
};

// Get all buyers with pagination and filtering
export const getAllBuyers = async (req, res) => {
    try {
        await connectDB();
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        
        const skip = (page - 1) * limit;
        
        // Build search query for buyers only
        const searchQuery = {
            role: 'buyer',
            ...(search && {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            })
        };
        
        const totalBuyers = await User.countDocuments(searchQuery);
        
        // Get buyers with their bidding statistics
        const buyers = await User.aggregate([
            { $match: searchQuery },
            {
                $lookup: {
                    from: 'products',
                    let: { buyerId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: ['$$buyerId', '$bids.bidder']
                                }
                            }
                        }
                    ],
                    as: 'participatedAuctions'
                }
            },
            {
                $lookup: {
                    from: 'products',
                    let: { buyerId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $lte: ['$itemEndDate', new Date()] },
                                        { $eq: ['$winner', '$$buyerId'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'wonAuctions'
                }
            },
            {
                $addFields: {
                    totalBids: {
                        $sum: {
                            $map: {
                                input: '$participatedAuctions',
                                as: 'auction',
                                in: {
                                    $size: {
                                        $filter: {
                                            input: '$$auction.bids',
                                            cond: { $eq: ['$$this.bidder', '$_id'] }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    wonAuctions: { $size: '$wonAuctions' },
                    activeParticipations: {
                        $size: {
                            $filter: {
                                input: '$participatedAuctions',
                                cond: { $gt: ['$$this.itemEndDate', new Date()] }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    role: 1,
                    createdAt: 1,
                    lastLogin: 1,
                    location: 1,
                    avatar: 1,
                    totalBids: 1,
                    wonAuctions: 1,
                    activeParticipations: 1
                }
            },
            { $sort: { [sortBy]: sortOrder } },
            { $skip: skip },
            { $limit: limit }
        ]);
        
        const totalPages = Math.ceil(totalBuyers / limit);
        
        res.status(200).json({
            success: true,
            data: {
                buyers,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalBuyers,
                    limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Error fetching buyers:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching buyers', 
            error: error.message 
        });
    }
};

// Get all pending auctions for approval
export const getPendingAuctions = async (req, res) => {
    try {
        await connectDB();
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const totalPending = await Product.countDocuments({ approvalStatus: 'pending' });
        
        const pendingAuctions = await Product.find({ approvalStatus: 'pending' })
            .populate('seller', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const totalPages = Math.ceil(totalPending / limit);
        
        res.status(200).json({
            success: true,
            data: {
                auctions: pendingAuctions,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalPending,
                    limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Error fetching pending auctions:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching pending auctions', 
            error: error.message 
        });
    }
};

// Approve an auction
export const approveAuction = async (req, res) => {
    try {
        await connectDB();
        
        const { auctionId } = req.params;
        const { adminNotes } = req.body;
        const adminId = req.user.id;
        
        const auction = await Product.findByIdAndUpdate(
            auctionId,
            {
                approvalStatus: 'approved',
                approvedBy: adminId,
                approvalDate: new Date(),
                adminNotes: adminNotes || null
            },
            { new: true }
        ).populate('seller', 'name email');
        
        if (!auction) {
            return res.status(404).json({
                success: false,
                message: 'Auction not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Auction approved successfully',
            data: auction
        });
    } catch (error) {
        console.error('Error approving auction:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error approving auction', 
            error: error.message 
        });
    }
};

// Reject an auction
export const rejectAuction = async (req, res) => {
    try {
        await connectDB();
        
        const { auctionId } = req.params;
        const { rejectionReason, adminNotes } = req.body;
        const adminId = req.user.id;
        
        if (!rejectionReason) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }
        
        const auction = await Product.findByIdAndUpdate(
            auctionId,
            {
                approvalStatus: 'rejected',
                approvedBy: adminId,
                approvalDate: new Date(),
                rejectionReason,
                adminNotes: adminNotes || null
            },
            { new: true }
        ).populate('seller', 'name email');
        
        if (!auction) {
            return res.status(404).json({
                success: false,
                message: 'Auction not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Auction rejected successfully',
            data: auction
        });
    } catch (error) {
        console.error('Error rejecting auction:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error rejecting auction', 
            error: error.message 
        });
    }
};

// Get all auctions with their approval status
export const getAllAuctions = async (req, res) => {
    try {
        await connectDB();
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status || 'all'; // all, pending, approved, rejected
        const skip = (page - 1) * limit;
        
        const searchQuery = status === 'all' ? {} : { approvalStatus: status };
        
        const totalAuctions = await Product.countDocuments(searchQuery);
        
        const auctions = await Product.find(searchQuery)
            .populate('seller', 'name email')
            .populate('approvedBy', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const totalPages = Math.ceil(totalAuctions / limit);
        
        res.status(200).json({
            success: true,
            data: {
                auctions,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalAuctions,
                    limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Error fetching auctions:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching auctions', 
            error: error.message 
        });
    }
};

// Migrate existing auctions to approved status
export const migrateExistingAuctions = async (req, res) => {
    try {
        await connectDB();
        console.log('🔄 Starting migration: Setting existing auctions as approved...');
        
        // Find all auctions that don't have an approvalStatus set (or are pending)
        const result = await Product.updateMany(
            {
                $or: [
                    { approvalStatus: { $exists: false } },
                    { approvalStatus: 'pending' }
                ]
            },
            {
                $set: {
                    approvalStatus: 'approved',
                    approvalDate: new Date(),
                    adminNotes: 'Auto-approved: Existing auction before approval system implementation'
                }
            }
        );
        
        console.log(`✅ Migration completed successfully!`);
        console.log(`📊 Updated ${result.modifiedCount} auctions to approved status`);
        
        // Get count of approved auctions
        const approvedCount = await Product.countDocuments({ approvalStatus: 'approved' });
        console.log(`📈 Total approved auctions: ${approvedCount}`);
        
        res.status(200).json({
            success: true,
            message: 'Migration completed successfully',
            data: {
                modifiedCount: result.modifiedCount,
                totalApproved: approvedCount
            }
        });
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        res.status(500).json({
            success: false,
            message: 'Migration failed',
            error: error.message
        });
    }
};
