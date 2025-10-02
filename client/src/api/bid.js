// Seller bid management API functions

// Get all bids for seller's auctions
export const getSellerBids = async () => {
  const response = await fetch('/api/bids/seller/all', {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch seller bids');
  }
  
  const data = await response.json();
  return data.bids;
};

// Get bids for a specific auction
export const getAuctionBids = async (auctionId) => {
  const response = await fetch(`/api/bids/seller/auction/${auctionId}`, {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch auction bids');
  }
  
  const data = await response.json();
  return data;
};

// Get bid statistics for seller dashboard
export const getBidStatistics = async () => {
  const response = await fetch('/api/bids/seller/statistics', {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch bid statistics');
  }
  
  const data = await response.json();
  return data.statistics;
};