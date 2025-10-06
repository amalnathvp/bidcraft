import mongoose from 'mongoose';
import Product from '../models/product.js';
import { connectDB } from '../connection.js';

// Migration script to set all existing auctions as approved
export const migrateExistingAuctions = async () => {
    try {
        console.log('🔗 Connecting to database...');
        await connectDB();
        console.log('✅ Connected to database successfully');
        
        console.log('🔄 Starting migration: Setting existing auctions as approved...');
        
        // First check existing auction counts
        const totalAuctions = await Product.countDocuments({});
        console.log(`📊 Total auctions in database: ${totalAuctions}`);
        
        const auctionsWithoutStatus = await Product.countDocuments({
            $or: [
                { approvalStatus: { $exists: false } },
                { approvalStatus: null }
            ]
        });
        console.log(`🔍 Auctions without approval status: ${auctionsWithoutStatus}`);
        
        const pendingAuctions = await Product.countDocuments({ approvalStatus: 'pending' });
        console.log(`⏳ Pending auctions: ${pendingAuctions}`);
        
        // Find all auctions that don't have an approvalStatus set (or are pending)
        const result = await Product.updateMany(
            {
                $or: [
                    { approvalStatus: { $exists: false } },
                    { approvalStatus: null },
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
        
        return {
            success: true,
            modifiedCount: result.modifiedCount,
            totalApproved: approvedCount
        };
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
};

// Run migration if this file is executed directly
const isMainModule = process.argv[1] && process.argv[1].includes('migrateAuctions.js');

if (isMainModule) {
    console.log('🎬 Running migration directly from command line...');
    migrateExistingAuctions()
        .then((result) => {
            console.log('🎉 Migration script completed successfully', result);
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration script failed:', error);
            process.exit(1);
        });
}