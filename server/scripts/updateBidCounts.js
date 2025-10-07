import mongoose from 'mongoose';
import Product from '../models/product.js';
import { connectDB } from '../connection.js';

async function updateBidCounts() {
    try {
        console.log('🔄 Starting bid count update...');
        await connectDB();
        
        // Find all products
        const products = await Product.find({});
        console.log(`📊 Found ${products.length} auctions to update`);
        
        let updatedCount = 0;
        
        for (const product of products) {
            const actualBidCount = product.bids ? product.bids.length : 0;
            
            // Only update if bidCount is different from actual bids length
            if (product.bidCount !== actualBidCount) {
                await Product.findByIdAndUpdate(product._id, {
                    bidCount: actualBidCount
                });
                updatedCount++;
                console.log(`✅ Updated auction ${product.itemName}: bidCount set to ${actualBidCount}`);
            }
        }
        
        console.log(`🎉 Migration completed successfully!`);
        console.log(`📈 Updated ${updatedCount} auctions with correct bid counts`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Check if this script is being run directly
const currentFileUrl = new URL(import.meta.url).pathname;
const scriptPath = process.argv[1];
const isMainScript = currentFileUrl.includes('updateBidCounts.js') || scriptPath.includes('updateBidCounts.js');

if (isMainScript) {
    updateBidCounts();
}

export { updateBidCounts };