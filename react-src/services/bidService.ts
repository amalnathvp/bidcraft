/**
 * API service functions for bid-related operations
 * Handles bid placement and bid history functionality
 */

import { api } from './api';
import { Bid } from '../types';

// Response interfaces for bid API endpoints
interface BidResponse {
  success: boolean;
  data: Bid;
  message?: string;
}

interface BidsResponse {
  success: boolean;
  data: Bid[];
  message?: string;
}

interface PlaceBidRequest {
  amount: number;
  isMaxBid?: boolean;
  maxBidAmount?: number;
}

export const bidService = {
  /**
   * Place a bid on an auction (requires authentication)
   */
  placeBid: async (auctionId: string, bidData: PlaceBidRequest): Promise<BidResponse> => {
    return api.post<BidResponse>(`/bids/${auctionId}`, bidData, true);
  },

  /**
   * Get bid history for an auction
   */
  getAuctionBids: async (auctionId: string): Promise<BidsResponse> => {
    return api.get<BidsResponse>(`/bids/auction/${auctionId}`);
  },

  /**
   * Get user's bid history (requires authentication)
   */
  getUserBids: async (): Promise<BidsResponse> => {
    return api.get<BidsResponse>('/bids/my-bids', true);
  },

  /**
   * Get user's winning bids (requires authentication)
   */
  getWinningBids: async (): Promise<BidsResponse> => {
    return api.get<BidsResponse>('/bids/winning', true);
  },

  /**
   * Cancel a bid (if allowed)
   */
  cancelBid: async (bidId: string): Promise<{ success: boolean; message: string }> => {
    return api.delete<{ success: boolean; message: string }>(`/bids/${bidId}`, true);
  }
};
