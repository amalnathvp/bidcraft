import uploadImage from '../services/cloudinaryService.js';
import Product from '../models/product.js';
import mongoose from "mongoose"
import { connectDB } from '../connection.js'


export const createAuction = async (req, res) => {
    try {
        console.log('=== CREATE AUCTION REQUEST ===');
        console.log('User ID:', req.user?.id);
        console.log('Request body:', req.body);
        console.log('Request files:', req.files ? `${req.files.length} files present` : 'No files');
        
        await connectDB();
        const { itemName, startingPrice, itemDescription, itemCategory, itemStartDate, itemEndDate } = req.body;
        let imageUrls = [];

        // Validate required fields
        if (!itemName || !startingPrice || !itemDescription || !itemCategory || !itemEndDate) {
            console.log('Missing required fields:', {
                itemName: !!itemName,
                startingPrice: !!startingPrice, 
                itemDescription: !!itemDescription,
                itemCategory: !!itemCategory,
                itemEndDate: !!itemEndDate
            });
            return res.status(400).json({ 
                message: 'Missing required fields',
                required: ['itemName', 'startingPrice', 'itemDescription', 'itemCategory', 'itemEndDate'],
                received: { itemName, startingPrice, itemDescription, itemCategory, itemEndDate }
            });
        }

        // Handle multiple image uploads with better error handling
        if (req.files && req.files.length > 0) {
            try {
                console.log(`Uploading ${req.files.length} images...`);
                const uploadPromises = req.files.map(file => uploadImage(file));
                imageUrls = await Promise.all(uploadPromises);
                console.log('Images uploaded successfully:', imageUrls);
            } catch (error) {
                console.warn('Some images failed to upload, continuing with uploaded ones:', error.message);
                // Filter out any failed uploads (null/undefined values)
                imageUrls = imageUrls.filter(url => url);
            }
        }

        const start = itemStartDate ? new Date(itemStartDate) : new Date();
        const end = new Date(itemEndDate);
        
        console.log('Date validation:', { start, end, valid: end > start });
        
        if (end <= start) {
            return res.status(400).json({ message: 'Auction end date must be after start date' });
        }

        const auctionData = {
            itemName,
            startingPrice: Number(startingPrice),
            currentPrice: Number(startingPrice),
            itemDescription,
            itemCategory,
            itemPhotos: imageUrls,
            itemStartDate: start,
            itemEndDate: end,
            seller: req.user.id,
        };
        
        console.log('Creating auction with data:', auctionData);
        
        const newAuction = new Product(auctionData);
        await newAuction.save();
        
        console.log('Auction created successfully:', newAuction._id);

        res.status(201).json({ 
            message: 'Auction created successfully', 
            newAuction,
            imageUploadStatus: imageUrls.length > 0 ? `${imageUrls.length} images uploaded` : 'no images'
        });
    } catch (error) {
        console.error('Error creating auction:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            message: 'Error creating auction', 
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const showAuction = async (req, res) => {
    try {
        await connectDB();
        const auction = await Product.find({ 
            itemEndDate: { $gt: new Date() },
            approvalStatus: 'approved'  // Only show approved auctions
        })
            .populate("seller", "name")
            .select("itemName itemDescription currentPrice bids itemEndDate itemCategory itemPhotos seller")
            .sort({ createdAt: -1 });
        const formatted = auction.map(auction => ({
            _id: auction._id,
            itemName: auction.itemName,
            itemDescription: auction.itemDescription,
            currentPrice: auction.currentPrice,
            bidCount: auction.bidCount || auction.bids.length,
            timeLeft: Math.max(0, new Date(auction.itemEndDate) - new Date()),
            itemCategory: auction.itemCategory,
            sellerName: auction.seller.name,
            itemPhotos: auction.itemPhotos,
        }));

        res.status(200).json(formatted);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching auctions', error: error.message });
    }
}

export const auctionById = async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        const auction = await Product.findById(id)
            .populate("seller", "name email businessName businessType city state country verified signupAt description website averageRating totalSales")
            .populate("bids.bidder", "name email");
        
        if (!auction) {
            return res.status(404).json({ message: "Auction not found" });
        }
        
        // Transform the auction data to match frontend expectations
        const transformedAuction = auction.toObject();
        if (transformedAuction.bids && transformedAuction.bids.length > 0) {
            transformedAuction.bids = transformedAuction.bids.map(bid => ({
                _id: bid._id,
                bidAmount: bid.amount,
                bidTime: bid.timestamp,
                buyerName: bid.bidder?.name || 'Anonymous',
                buyerEmail: bid.bidder?.email || 'Not available',
                buyerId: bid.bidder?._id
            }));
            // Sort by newest first
            transformedAuction.bids.sort((a, b) => new Date(b.bidTime) - new Date(a.bidTime));
        }
        
        res.status(200).json(transformedAuction);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching auction', error: error.message });
    }
}

export const placeBid = async (req, res) => {
    try {
        await connectDB();
        const { bidAmount } = req.body;
        const user = req.user.id;
        const { id } = req.params;

        const product = await Product.findById(id).populate('bids.bidder', "name");
        if (!product) return res.status(404).json({ message: "Auction not found" });

        if (new Date(product.itemEndDate) < new Date()) return res.status(400).json({ message: "Auction has already ended" });

        const minBid = Math.max(product.currentPrice, product.startingPrice) + 1;
        const maxBid = Math.max(product.currentPrice, product.startingPrice) + 10;
        if (bidAmount < minBid) return res.status(400).json({ message: `Bid must be at least Rs ${minBid}` })
        if (bidAmount > maxBid) return res.status(400).json({ message: `Bid must be at max Rs ${maxBid}` })

        product.bids.push({
            bidder: user,
            amount: bidAmount, // Changed from bidAmount to amount to match schema
        })

        product.currentPrice = bidAmount;
        product.bidCount = product.bids.length; // Update bidCount field
        await product.save();
        res.status(200).json({ message: "Bid placed successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error placing bid", error: error.message })
    }
}

export const dashboardData = async (req, res) => {
    try {
        await connectDB();
        const userObjectId = new mongoose.Types.ObjectId(req.user.id);
        const dateNow = new Date();
        const stats = await Product.aggregate([
            {
                $facet: {
                    totalAuctions: [{ $count: "count" }],
                    userAuctionCount: [{ $match: { seller: userObjectId } }, { $count: "count" }],
                    activeAuctions: [
                        { $match: { itemStartDate: { $lte: dateNow }, itemEndDate: { $gte: dateNow } } },
                        { $count: "count" }
                    ]
                }
            }
        ]);

        const totalAuctions = stats[0].totalAuctions[0]?.count || 0;
        const userAuctionCount = stats[0].userAuctionCount[0]?.count || 0;
        const activeAuctions = stats[0].activeAuctions[0]?.count || 0;

        const globalAuction = await Product.find({ itemEndDate: { $gt: dateNow } }).populate("seller", "name").sort({ createdAt: -1 }).limit(3);;
        const latestAuctions = globalAuction.map(auction => ({
            _id: auction._id,
            itemName: auction.itemName,
            itemDescription: auction.itemDescription,
            currentPrice: auction.currentPrice,
            bidCount: auction.bidCount || auction.bids.length,
            timeLeft: Math.max(0, new Date(auction.itemEndDate) - new Date()),
            itemCategory: auction.itemCategory,
            sellerName: auction.seller.name,
            itemPhotos: auction.itemPhotos,
        }));

        const userAuction = await Product.find({ seller: userObjectId }).populate("seller", "name").sort({ createdAt: -1 }).limit(3);
        const latestUserAuctions = userAuction.map(auction => ({
            _id: auction._id,
            itemName: auction.itemName,
            itemDescription: auction.itemDescription,
            currentPrice: auction.currentPrice,
            bidCount: auction.bidCount || auction.bids.length,
            timeLeft: Math.max(0, new Date(auction.itemEndDate) - new Date()),
            itemCategory: auction.itemCategory,
            sellerName: auction.seller.name,
            itemPhotos: auction.itemPhotos,
        }));

        return res.status(200).json({ totalAuctions, userAuctionCount, activeAuctions, latestAuctions, latestUserAuctions })

    } catch (error) {
        res.status(500).json({ message: "Error getting dashboard data", error: error.message })
    }
}

export const myAuction = async (req, res) => {
    try {
        await connectDB();
        const auction = await Product.find({ seller: req.user.id })
            .populate("seller", "name")
            .populate("bids.bidder", "name") // Also populate bidder info
            .sort({ createdAt: -1 });
        
        const formatted = auction.map(auction => {
            // Get the correct bid count - use database field if available, otherwise calculate
            let bidCount = auction.bidCount || 0;
            if (bidCount === 0 && auction.bids) {
                bidCount = auction.bids.length;
            }
            
            // Calculate total bid amount and average bid amount for this auction
            const actualBids = auction.bids || [];
            const totalBidAmount = actualBids.reduce((sum, bid) => {
                // Handle both 'amount' (correct schema) and 'bidAmount' (legacy) for backward compatibility
                const bidValue = bid.amount || bid.bidAmount || 0;
                return sum + bidValue;
            }, 0);
            const avgBidAmount = actualBids.length > 0 ? (totalBidAmount / actualBids.length) : 0;
            
            return {
                _id: auction._id,
                itemName: auction.itemName,
                itemDescription: auction.itemDescription,
                currentPrice: auction.currentPrice,
                bidCount: bidCount, // Use calculated/database bid count
                totalBidAmount: totalBidAmount, // Total amount of all bids
                avgBidAmount: avgBidAmount, // Average bid amount
                timeLeft: Math.max(0, new Date(auction.itemEndDate) - new Date()),
                itemCategory: auction.itemCategory,
                sellerName: auction.seller.name,
                itemPhotos: auction.itemPhotos,
                // Add approval status fields
                approvalStatus: auction.approvalStatus,
                rejectionReason: auction.rejectionReason,
                adminNotes: auction.adminNotes,
                approvalDate: auction.approvalDate
            };
        });

        res.status(200).json(formatted);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching auctions', error: error.message });
    }
}

// Update auction
export const updateAuction = async (req, res) => {
    try {
        console.log('=== UPDATE AUCTION REQUEST ===');
        console.log('User ID:', req.user?.id);
        console.log('Request body:', req.body);
        console.log('Request files:', req.files ? `${req.files.length} files present` : 'No files');
        
        await connectDB();
        const { id } = req.params;
        const { itemName, itemDescription, startingPrice, itemCategory, itemEndDate, existingImages } = req.body;

        // Find the auction and verify ownership
        const auction = await Product.findById(id);
        if (!auction) {
            return res.status(404).json({ message: 'Auction not found' });
        }

        if (auction.seller.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only edit your own auctions' });
        }

        // Check if auction has bids - if so, only allow limited edits
        if (auction.bids.length > 0) {
            return res.status(400).json({ 
                message: 'Cannot edit auction that already has bids' 
            });
        }

        // Handle image updates
        let imageUrls = [];
        
        // Add existing images that weren't removed
        if (existingImages) {
            if (Array.isArray(existingImages)) {
                imageUrls = [...existingImages];
            } else {
                // If it's a single string, convert to array
                imageUrls = [existingImages];
            }
        }

        // Handle new image uploads
        if (req.files && req.files.length > 0) {
            try {
                console.log(`Uploading ${req.files.length} new images...`);
                const uploadPromises = req.files.map(file => uploadImage(file));
                const newImageUrls = await Promise.all(uploadPromises);
                imageUrls = [...imageUrls, ...newImageUrls];
                console.log('New images uploaded successfully:', newImageUrls);
            } catch (error) {
                console.error('Image upload error:', error);
                return res.status(500).json({ message: 'Error uploading images', error: error.message });
            }
        }

        // Update the auction
        const updatedAuction = await Product.findByIdAndUpdate(
            id,
            {
                itemName: itemName || auction.itemName,
                itemDescription: itemDescription || auction.itemDescription,
                startingPrice: startingPrice || auction.startingPrice,
                currentPrice: startingPrice || auction.currentPrice,
                itemCategory: itemCategory || auction.itemCategory,
                itemEndDate: itemEndDate || auction.itemEndDate,
                itemPhotos: imageUrls.length > 0 ? imageUrls : auction.itemPhotos,
            },
            { new: true }
        );

        console.log('Auction updated successfully');
        res.status(200).json({ 
            message: 'Auction updated successfully', 
            auction: updatedAuction 
        });
    } catch (error) {
        console.error('Update auction error:', error);
        res.status(500).json({ message: 'Error updating auction', error: error.message });
    }
}

// Delete auction
export const deleteAuction = async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;

        // Find the auction and verify ownership
        const auction = await Product.findById(id);
        if (!auction) {
            return res.status(404).json({ message: 'Auction not found' });
        }

        if (auction.seller.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only delete your own auctions' });
        }

        // Check if auction has bids - if so, don't allow deletion
        if (auction.bids.length > 0) {
            return res.status(400).json({ 
                message: 'Cannot delete auction that has bids' 
            });
        }

        await Product.findByIdAndDelete(id);

        res.status(200).json({ message: 'Auction deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting auction', error: error.message });
    }
}