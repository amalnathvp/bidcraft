const cron = require('node-cron');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const sendEmail = require('./sendEmail');

// Job to update auction statuses
const updateAuctionStatuses = async () => {
  try {
    const now = new Date();
    
    // Find scheduled auctions that should be active
    const scheduledAuctions = await Auction.find({
      status: 'scheduled',
      startTime: { $lte: now }
    });
    
    for (const auction of scheduledAuctions) {
      auction.status = 'active';
      await auction.save();
      console.log(`Activated auction: ${auction.title}`);
    }
    
    // Find active auctions that should be ended
    const endedAuctions = await Auction.find({
      status: 'active',
      endTime: { $lte: now }
    }).populate('seller', 'name email');
    
    for (const auction of endedAuctions) {
      // Find the highest bid
      const winningBid = await Bid.findOne({
        auction: auction._id,
        isValid: true
      })
        .sort({ amount: -1 })
        .populate('bidder', 'name email');
      
      if (winningBid && winningBid.amount >= auction.reservePrice) {
        // Auction sold
        auction.status = 'sold';
        auction.winner = winningBid.bidder._id;
        
        // Update bid statuses
        await Bid.updateMany(
          { auction: auction._id, _id: winningBid._id },
          { status: 'won' }
        );
        
        await Bid.updateMany(
          { auction: auction._id, _id: { $ne: winningBid._id } },
          { status: 'lost' }
        );
        
        // Send emails
        try {
          // Email to winner
          await sendEmail({
            email: winningBid.bidder.email,
            subject: 'Congratulations! You won the auction',
            html: `
              <h2>Congratulations ${winningBid.bidder.name}!</h2>
              <p>You have won the auction for "${auction.title}" with a bid of $${winningBid.amount}.</p>
              <p>Please proceed with payment and contact the seller for delivery arrangements.</p>
              <p>Seller: ${auction.seller.name}</p>
              <p>Thank you for using BidCraft!</p>
            `
          });
          
          // Email to seller
          await sendEmail({
            email: auction.seller.email,
            subject: 'Your auction has ended - Item sold!',
            html: `
              <h2>Great news ${auction.seller.name}!</h2>
              <p>Your auction for "${auction.title}" has ended successfully.</p>
              <p>Winning bid: $${winningBid.amount}</p>
              <p>Winner: ${winningBid.bidder.name}</p>
              <p>Please contact the buyer to arrange payment and delivery.</p>
              <p>Thank you for using BidCraft!</p>
            `
          });
        } catch (emailError) {
          console.error('Error sending auction end emails:', emailError);
        }
        
        console.log(`Auction sold: ${auction.title} for $${winningBid.amount}`);
      } else {
        // Auction ended without sale
        auction.status = 'ended';
        
        // Update all bid statuses
        await Bid.updateMany(
          { auction: auction._id },
          { status: 'lost' }
        );
        
        // Email to seller
        try {
          await sendEmail({
            email: auction.seller.email,
            subject: 'Your auction has ended',
            html: `
              <h2>Hello ${auction.seller.name},</h2>
              <p>Your auction for "${auction.title}" has ended.</p>
              ${winningBid ? 
                `<p>The highest bid of $${winningBid.amount} did not meet your reserve price of $${auction.reservePrice}.</p>` :
                '<p>Unfortunately, there were no bids on this item.</p>'
              }
              <p>You can create a new auction or adjust your settings and try again.</p>
              <p>Thank you for using BidCraft!</p>
            `
          });
        } catch (emailError) {
          console.error('Error sending auction end email to seller:', emailError);
        }
        
        console.log(`Auction ended without sale: ${auction.title}`);
      }
      
      await auction.save();
    }
    
    if (scheduledAuctions.length > 0 || endedAuctions.length > 0) {
      console.log(`Updated ${scheduledAuctions.length} scheduled auctions and ${endedAuctions.length} ended auctions`);
    }
  } catch (error) {
    console.error('Error in auction status update job:', error);
  }
};

// Job to send ending soon notifications
const sendEndingSoonNotifications = async () => {
  try {
    const oneHour = new Date(Date.now() + 60 * 60 * 1000);
    const now = new Date();
    
    // Find auctions ending in the next hour that haven't been notified
    const endingSoonAuctions = await Auction.find({
      status: 'active',
      endTime: { $gte: now, $lte: oneHour },
      endingSoonNotified: { $ne: true }
    }).populate('watchers', 'name email notifications');
    
    for (const auction of endingSoonAuctions) {
      // Send notifications to watchers
      for (const watcher of auction.watchers) {
        if (watcher.notifications?.email?.auctionUpdates) {
          try {
            await sendEmail({
              email: watcher.email,
              subject: 'Auction ending soon!',
              html: `
                <h2>Don't miss out ${watcher.name}!</h2>
                <p>The auction for "${auction.title}" is ending soon.</p>
                <p>Current price: $${auction.currentPrice}</p>
                <p>Time remaining: Less than 1 hour</p>
                <p>Don't miss your chance to bid!</p>
                <p><a href="${process.env.FRONTEND_URL}/auctions/${auction._id}">View Auction</a></p>
              `
            });
          } catch (emailError) {
            console.error('Error sending ending soon notification:', emailError);
          }
        }
      }
      
      // Mark as notified
      auction.endingSoonNotified = true;
      await auction.save();
      
      console.log(`Sent ending soon notifications for: ${auction.title}`);
    }
  } catch (error) {
    console.error('Error in ending soon notifications job:', error);
  }
};

// Job to clean up old data
const cleanupOldData = async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Remove old invalid bids
    const deletedBids = await Bid.deleteMany({
      isValid: false,
      createdAt: { $lt: thirtyDaysAgo }
    });
    
    if (deletedBids.deletedCount > 0) {
      console.log(`Cleaned up ${deletedBids.deletedCount} old invalid bids`);
    }
  } catch (error) {
    console.error('Error in cleanup job:', error);
  }
};

// Schedule jobs
const startScheduledJobs = () => {
  // Update auction statuses every minute
  cron.schedule('* * * * *', updateAuctionStatuses);
  
  // Send ending soon notifications every 15 minutes
  cron.schedule('*/15 * * * *', sendEndingSoonNotifications);
  
  // Cleanup old data daily at 2 AM
  cron.schedule('0 2 * * *', cleanupOldData);
  
  console.log('Scheduled jobs started:');
  console.log('- Auction status updates: Every minute');
  console.log('- Ending soon notifications: Every 15 minutes');
  console.log('- Data cleanup: Daily at 2 AM');
};

module.exports = {
  startScheduledJobs,
  updateAuctionStatuses,
  sendEndingSoonNotifications,
  cleanupOldData
};
