/**
 * API service functions for auction-related operations
 * Handles all auction CRUD operations and related functionality
 */

import { apiService } from './api';

// Simplified auction service that works with the existing API service
export const auctionService = {
  /**
   * Get all auctions with optional filters
   */
  getAuctions: async (params: any = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/auctions?${queryString}` : '/auctions';
    return apiService.get(endpoint);
  },

  /**
   * Get featured auctions for homepage display
   */
  getFeaturedAuctions: async () => {
    return apiService.get('/auctions/featured');
  },

  /**
   * Get a single auction by ID
   */
  getAuction: async (id: string) => {
    return apiService.get(`/auctions/${id}`);
  },

  /**
   * Create a new auction (requires seller authentication)
   */
  createAuction: async (auctionData: FormData) => {
    return apiService.postFormData('/auctions', auctionData);
  },

  /**
   * Get seller's own auctions (requires seller authentication)
   */
  getMyAuctions: async (params: any = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString 
      ? `/auctions/seller/my-auctions?${queryString}` 
      : '/auctions/seller/my-auctions';
    return apiService.get(endpoint);
  },

  /**
   * Delete an auction (requires seller authentication)
   */
  deleteAuction: async (id: string) => {
    return apiService.delete(`/auctions/${id}`);
  },

  /**
   * Update an existing auction (requires seller authentication)
   */
  updateAuction: async (id: string, auctionData: any) => {
    return apiService.put(`/auctions/${id}`, auctionData);
  }
};
