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

// Buyer bid management API functions

// Get all bids placed by the buyer
export const getBuyerBids = async (page = 1, status = 'all') => {
  const params = new URLSearchParams({ 
    page: page.toString(),
    limit: '20' // Request more items per page to reduce requests
  });
  if (status !== 'all') {
    params.append('status', status);
  }
  
  // Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    const response = await fetch(`/api/bids/buyer?${params}`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch buyer bids (${response.status})`);
    }
    
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    throw error;
  }
};

// Delete/withdraw a bid
export const deleteBuyerBid = async (bidId) => {
  console.log('Attempting to delete bid:', bidId);
  
  const response = await fetch(`/api/bids/${bidId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  
  console.log('Delete response status:', response.status);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to delete bid' }));
    console.error('Delete bid error:', errorData);
    throw new Error(errorData.message || `Failed to delete bid (${response.status})`);
  }
  
  const result = await response.json();
  console.log('Delete bid success:', result);
  return result;
};

// Get buyer bid statistics
export const getBuyerBidStatistics = async () => {
  const response = await fetch('/api/bids/buyer/statistics', {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch bid statistics');
  }
  
  return response.json();
};