import Notification from '../models/notification.js';
import Product from '../models/product.js';

// Service to create notifications for various auction events
export class NotificationService {
  
  // Create notification when a bid is placed
  static async createBidPlacedNotification(bidData) {
    try {
      const { bidderId, auctionId, bidAmount, itemName } = bidData;
      
      const notification = new Notification({
        recipient: bidderId,
        type: 'bid_placed',
        title: 'Bid placed successfully',
        message: `Your bid of $${bidAmount} was placed on "${itemName}"`,
        auction: auctionId,
        metadata: {
          bidAmount: bidAmount,
          bidTime: new Date()
        }
      });
      
      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating bid placed notification:', error);
      throw error;
    }
  }
  
  // Create notification when a buyer is outbid
  static async createOutbidNotification(outbidData) {
    try {
      const { outbidBuyerId, auctionId, newBidAmount, itemName, previousBidAmount } = outbidData;
      
      const notification = new Notification({
        recipient: outbidBuyerId,
        type: 'outbid',
        title: 'You were outbid!',
        message: `Someone placed a bid of $${newBidAmount} on "${itemName}" (your bid was $${previousBidAmount})`,
        auction: auctionId,
        metadata: {
          previousBidAmount: previousBidAmount,
          newBidAmount: newBidAmount,
          outbidTime: new Date()
        }
      });
      
      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating outbid notification:', error);
      throw error;
    }
  }
  
  // Create notification when an auction is won
  static async createAuctionWonNotification(winnerData) {
    try {
      const { winnerId, auctionId, winningBid, itemName } = winnerData;
      
      const notification = new Notification({
        recipient: winnerId,
        type: 'auction_won',
        title: 'Congratulations! You won the auction',
        message: `You won "${itemName}" with a bid of $${winningBid}`,
        auction: auctionId,
        metadata: {
          winningBid: winningBid,
          wonTime: new Date()
        }
      });
      
      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating auction won notification:', error);
      throw error;
    }
  }
  
  // Create notification when an auction is lost
  static async createAuctionLostNotification(loserData) {
    try {
      const { loserId, auctionId, winningBid, itemName, userBid } = loserData;
      
      const notification = new Notification({
        recipient: loserId,
        type: 'auction_lost',
        title: 'Auction ended',
        message: `The auction for "${itemName}" ended. Winning bid was $${winningBid} (your bid: $${userBid})`,
        auction: auctionId,
        metadata: {
          winningBid: winningBid,
          userBid: userBid,
          endTime: new Date()
        }
      });
      
      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating auction lost notification:', error);
      throw error;
    }
  }
  
  // Create notification when someone bids on a saved item
  static async createSavedItemBidNotification(savedItemData) {
    try {
      const { userId, auctionId, bidAmount, itemName } = savedItemData;
      
      const notification = new Notification({
        recipient: userId,
        type: 'saved_item_bid',
        title: 'New bid on saved item',
        message: `Someone bid $${bidAmount} on "${itemName}" in your saved items`,
        auction: auctionId,
        metadata: {
          bidAmount: bidAmount,
          bidTime: new Date()
        }
      });
      
      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating saved item bid notification:', error);
      throw error;
    }
  }
  
  // Create notification when an auction is ending soon
  static async createAuctionEndingSoonNotification(endingSoonData) {
    try {
      const { bidderId, auctionId, itemName, endTime, timeRemaining } = endingSoonData;
      
      const notification = new Notification({
        recipient: bidderId,
        type: 'auction_ending_soon',
        title: 'Auction ending soon',
        message: `"${itemName}" auction ends in ${timeRemaining}. Don't miss your chance!`,
        auction: auctionId,
        metadata: {
          endTime: endTime,
          timeRemaining: timeRemaining,
          reminderTime: new Date()
        }
      });
      
      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating auction ending soon notification:', error);
      throw error;
    }
  }
  
  // Process auction end - create notifications for all participants
  static async processAuctionEndNotifications(auctionId) {
    try {
      const auction = await Product.findById(auctionId).populate('bids.bidder', 'name email');
      if (!auction) {
        throw new Error('Auction not found');
      }
      
      const bids = auction.bids || [];
      if (bids.length === 0) {
        return; // No bids to process
      }
      
      // Sort bids by amount (highest first)
      const sortedBids = bids.sort((a, b) => b.bidAmount - a.bidAmount);
      const winningBid = sortedBids[0];
      const losingBids = sortedBids.slice(1);
      
      // Create winner notification
      if (winningBid) {
        await this.createAuctionWonNotification({
          winnerId: winningBid.bidder._id,
          auctionId: auctionId,
          winningBid: winningBid.bidAmount,
          itemName: auction.itemName
        });
      }
      
      // Create loser notifications
      for (const bid of losingBids) {
        await this.createAuctionLostNotification({
          loserId: bid.bidder._id,
          auctionId: auctionId,
          winningBid: winningBid.bidAmount,
          itemName: auction.itemName,
          userBid: bid.bidAmount
        });
      }
      
      console.log(`Processed auction end notifications for auction ${auctionId}`);
    } catch (error) {
      console.error('Error processing auction end notifications:', error);
      throw error;
    }
  }
  
  // Send ending soon reminders for auctions ending within specified time
  static async sendEndingSoonReminders(hoursBeforeEnd = 24) {
    try {
      const now = new Date();
      const reminderTime = new Date(now.getTime() + (hoursBeforeEnd * 60 * 60 * 1000));
      
      // Find auctions ending within the specified time frame
      const endingAuctions = await Product.find({
        bidEndDate: {
          $gte: now,
          $lte: reminderTime
        },
        status: { $ne: 'ended' }
      }).populate('bids.bidder', '_id name email');
      
      for (const auction of endingAuctions) {
        const uniqueBidders = new Set();
        
        // Get unique bidders for this auction
        auction.bids.forEach(bid => {
          if (bid.bidder && bid.bidder._id) {
            uniqueBidders.add(bid.bidder._id.toString());
          }
        });
        
        // Calculate time remaining
        const timeRemaining = Math.round((auction.bidEndDate - now) / (1000 * 60 * 60));
        const timeRemainingText = timeRemaining > 1 ? `${timeRemaining} hours` : 'less than 1 hour';
        
        // Send reminder to each unique bidder
        for (const bidderId of uniqueBidders) {
          await this.createAuctionEndingSoonNotification({
            bidderId: bidderId,
            auctionId: auction._id,
            itemName: auction.itemName,
            endTime: auction.bidEndDate,
            timeRemaining: timeRemainingText
          });
        }
      }
      
      console.log(`Sent ending soon reminders for ${endingAuctions.length} auctions`);
    } catch (error) {
      console.error('Error sending ending soon reminders:', error);
      throw error;
    }
  }
}

export default NotificationService;