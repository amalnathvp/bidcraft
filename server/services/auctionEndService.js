import Product from '../models/product.js';
import NotificationService from '../services/notificationService.js';

export class AuctionEndService {
  
  // Check for ended auctions and process them
  static async processEndedAuctions() {
    try {
      const now = new Date();
      
      // Find auctions that have ended but haven't been processed yet
      const endedAuctions = await Product.find({
        itemEndDate: { $lte: now },
        status: { $ne: 'ended' } // Assuming we have a status field
      });

      console.log(`Found ${endedAuctions.length} ended auctions to process`);

      for (const auction of endedAuctions) {
        await this.processIndividualAuctionEnd(auction);
      }

      console.log('Finished processing ended auctions');
    } catch (error) {
      console.error('Error processing ended auctions:', error);
      throw error;
    }
  }

  // Process a single auction end
  static async processIndividualAuctionEnd(auction) {
    try {
      // Update auction status to ended
      auction.status = 'ended';
      auction.endedAt = new Date();
      await auction.save();

      // Process notifications for all participants
      await NotificationService.processAuctionEndNotifications(auction._id);
      
      console.log(`Processed auction end for: ${auction.itemName} (ID: ${auction._id})`);
    } catch (error) {
      console.error(`Error processing auction end for ${auction._id}:`, error);
      throw error;
    }
  }

  // Send ending soon reminders (call this periodically, e.g., every hour)
  static async sendEndingSoonReminders() {
    try {
      await NotificationService.sendEndingSoonReminders(24); // 24 hours before end
      console.log('Sent ending soon reminders');
    } catch (error) {
      console.error('Error sending ending soon reminders:', error);
      throw error;
    }
  }

  // Manual function to end a specific auction (for testing or admin use)
  static async endAuctionManually(auctionId) {
    try {
      const auction = await Product.findById(auctionId);
      if (!auction) {
        throw new Error('Auction not found');
      }

      await this.processIndividualAuctionEnd(auction);
      return { success: true, message: 'Auction ended successfully' };
    } catch (error) {
      console.error(`Error manually ending auction ${auctionId}:`, error);
      throw error;
    }
  }
}

export default AuctionEndService;