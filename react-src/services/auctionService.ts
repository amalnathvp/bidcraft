/**
 * API service functions for auction-related operations
 * Handles all auction CRUD operations and related functionality
 */

import { api } from './api';
import { AuctionItem } from '../types';

// Response interfaces for API endpoints
interface AuctionResponse {
  success: boolean;
  data: AuctionItem;
  message?: string;
}

interface AuctionsResponse {
  success: boolean;
  data: AuctionItem[];
  pagination?: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
  message?: string;
}

interface AuctionQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  featured?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Build query string from parameters
const buildQueryString = (params: AuctionQueryParams): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });
  
  return searchParams.toString();
};

export const auctionService = {
  /**
   * Get all auctions with optional filters and pagination
   */
  getAuctions: async (params: AuctionQueryParams = {}): Promise<AuctionsResponse> => {
    const queryString = buildQueryString(params);
    const endpoint = queryString ? `/auctions?${queryString}` : '/auctions';
    return api.get<AuctionsResponse>(endpoint);
  },

  /**
   * Get featured auctions for homepage display
   */
  getFeaturedAuctions: async (): Promise<AuctionsResponse> => {
    return api.get<AuctionsResponse>('/auctions/featured');
  },

  /**
   * Get auctions ending soon for urgent bidding
   */
  getEndingSoonAuctions: async (): Promise<AuctionsResponse> => {
    return api.get<AuctionsResponse>('/auctions/ending-soon');
  },

  /**
   * Get a single auction by ID
   */
  getAuction: async (id: string): Promise<AuctionResponse> => {
    return api.get<AuctionResponse>(`/auctions/${id}`);
  },

  /**
   * Search auctions by query
   */
  searchAuctions: async (query: string, params: AuctionQueryParams = {}): Promise<AuctionsResponse> => {
    const searchParams = { ...params, search: query };
    const queryString = buildQueryString(searchParams);
    return api.get<AuctionsResponse>(`/auctions/search?${queryString}`);
  },

  /**
   * Get auctions by category
   */
  getAuctionsByCategory: async (categoryId: string, params: AuctionQueryParams = {}): Promise<AuctionsResponse> => {
    const queryString = buildQueryString(params);
    const endpoint = queryString 
      ? `/auctions/categories/${categoryId}?${queryString}` 
      : `/auctions/categories/${categoryId}`;
    return api.get<AuctionsResponse>(endpoint);
  },

  /**
   * Create a new auction (requires seller authentication)
   */
  createAuction: async (auctionData: FormData): Promise<AuctionResponse> => {
    return api.postFormData<AuctionResponse>('/auctions', auctionData, true);
  },

  /**
   * Update an existing auction (requires seller authentication)
   */
  updateAuction: async (id: string, auctionData: Partial<AuctionItem>): Promise<AuctionResponse> => {
    return api.put<AuctionResponse>(`/auctions/${id}`, auctionData, true);
  },

  /**
   * Delete an auction (requires seller authentication)
   */
  deleteAuction: async (id: string): Promise<{ success: boolean; message: string }> => {
    return api.delete<{ success: boolean; message: string }>(`/auctions/${id}`, true);
  },

  /**
   * Publish a draft auction (requires seller authentication)
   */
  publishAuction: async (id: string): Promise<AuctionResponse> => {
    return api.post<AuctionResponse>(`/auctions/${id}/publish`, {}, true);
  },

  /**
   * Cancel an active auction (requires seller authentication)
   */
  cancelAuction: async (id: string): Promise<AuctionResponse> => {
    return api.post<AuctionResponse>(`/auctions/${id}/cancel`, {}, true);
  },

  /**
   * Get seller's own auctions (requires seller authentication)
   */
  getMyAuctions: async (params: AuctionQueryParams = {}): Promise<AuctionsResponse> => {
    const queryString = buildQueryString(params);
    const endpoint = queryString 
      ? `/auctions/seller/my-auctions?${queryString}` 
      : '/auctions/seller/my-auctions';
    return api.get<AuctionsResponse>(endpoint, true);
  },

  /**
   * Watch an auction (requires authentication)
   */
  watchAuction: async (id: string): Promise<{ success: boolean; message: string }> => {
    return api.post<{ success: boolean; message: string }>(`/auctions/${id}/watch`, {}, true);
  },

  /**
   * Unwatch an auction (requires authentication)
   */
  unwatchAuction: async (id: string): Promise<{ success: boolean; message: string }> => {
    return api.delete<{ success: boolean; message: string }>(`/auctions/${id}/watch`, true);
  },

  /**
   * Ask a question about an auction (requires authentication)
   */
  askQuestion: async (id: string, question: string): Promise<{ success: boolean; message: string }> => {
    return api.post<{ success: boolean; message: string }>(`/auctions/${id}/question`, { question }, true);
  },

  /**
   * Feature an auction (admin only)
   */
  featureAuction: async (id: string): Promise<AuctionResponse> => {
    return api.post<AuctionResponse>(`/auctions/${id}/feature`, {}, true);
  },

  /**
   * Report an auction (requires authentication)
   */
  reportAuction: async (id: string, reason: string): Promise<{ success: boolean; message: string }> => {
    return api.post<{ success: boolean; message: string }>(`/auctions/${id}/report`, { reason }, true);
  }
};
