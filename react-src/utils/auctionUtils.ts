/**
 * Utility functions for formatting auction and category data
 * Provides consistent data transformation and display helpers
 */

import { AuctionItem, LegacyAuctionItem, Category } from '../types';

/**
 * Format time remaining for display
 */
export const formatTimeRemaining = (endTime: string): string => {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) {
    return 'Auction ended';
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h left`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  } else {
    return `${minutes}m left`;
  }
};

/**
 * Format currency amount for display
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Get the primary image URL from auction images array
 */
export const getPrimaryImageUrl = (images: AuctionItem['images']): string => {
  if (!images || images.length === 0) {
    return 'https://via.placeholder.com/300x200?text=No+Image';
  }
  return images[0].url;
};

/**
 * Get artisan name from auction seller data
 */
export const getArtisanName = (seller: AuctionItem['seller']): string => {
  if (typeof seller === 'string') {
    return 'Unknown Artisan';
  }
  return seller.shopName || seller.name || 'Unknown Artisan';
};

/**
 * Check if auction is ending soon (within 1 hour)
 */
export const isEndingSoon = (endTime: string): boolean => {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end.getTime() - now.getTime();
  return diff > 0 && diff <= 3600000; // 1 hour in milliseconds
};

/**
 * Check if auction is live (active status and within time range)
 */
export const isAuctionLive = (auction: AuctionItem): boolean => {
  const now = new Date();
  const start = new Date(auction.startTime);
  const end = new Date(auction.endTime);
  
  return auction.status === 'active' && now >= start && now < end;
};

/**
 * Get auction status display text
 */
export const getAuctionStatusText = (auction: AuctionItem): string => {
  switch (auction.status) {
    case 'draft':
      return 'Draft';
    case 'scheduled':
      return 'Scheduled';
    case 'active':
      return isAuctionLive(auction) ? 'Live' : 'Active';
    case 'ended':
      return 'Ended';
    case 'cancelled':
      return 'Cancelled';
    case 'sold':
      return 'Sold';
    default:
      return 'Unknown';
  }
};

/**
 * Transform auction data for display compatibility
 */
export const transformAuctionForDisplay = (auction: AuctionItem): LegacyAuctionItem => {
  return {
    id: auction._id,
    title: auction.title,
    currentBid: auction.currentPrice,
    bidCount: auction.totalBids,
    timeRemaining: formatTimeRemaining(auction.endTime),
    imageUrl: getPrimaryImageUrl(auction.images),
    artisan: getArtisanName(auction.seller),
    isLive: isAuctionLive(auction),
  };
};

/**
 * Transform category data for display compatibility
 */
export const transformCategoryForDisplay = (category: Category) => {
  return {
    ...category,
    id: category._id, // Legacy compatibility
    itemCount: category.activeAuctions,
  };
};

/**
 * Calculate bid increment based on current price
 */
export const calculateBidIncrement = (currentPrice: number): number => {
  if (currentPrice < 50) return 1;
  if (currentPrice < 100) return 2;
  if (currentPrice < 500) return 5;
  if (currentPrice < 1000) return 10;
  if (currentPrice < 5000) return 25;
  return 50;
};

/**
 * Get minimum next bid amount
 */
export const getMinimumBidAmount = (currentPrice: number): number => {
  return currentPrice + calculateBidIncrement(currentPrice);
};

/**
 * Validate bid amount
 */
export const validateBidAmount = (amount: number, currentPrice: number): string | null => {
  const minBid = getMinimumBidAmount(currentPrice);
  
  if (amount < minBid) {
    return `Minimum bid is ${formatCurrency(minBid)}`;
  }
  
  return null;
};
