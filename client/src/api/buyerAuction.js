// Buyer-specific auction API functions

// Get all active auctions (public)
export const getBuyerAuctions = async () => {
  try {
    const response = await fetch('http://localhost:3000/buyer/auction/all', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      throw new Error(`Failed to fetch auctions: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Buyer auctions API response:', data);
    
    // Transform data to match expected format
    return data.auctions || data;
  } catch (error) {
    console.error('getBuyerAuctions error:', error);
    throw error;
  }
};

// Get specific auction details (public)
export const getBuyerAuctionDetails = async (auctionId) => {
  const response = await fetch(`/api/buyer/auction/view/${auctionId}`, {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch auction details');
  }
  
  const data = await response.json();
  return data.auction;
};

// Place bid on auction (buyer only)
export const placeBid = async ({ bidAmount, id }) => {
  const response = await fetch(`/api/buyer/auction/bid/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ bidAmount }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to place bid');
  }
  
  return response.json();
};

// Get buyer's bid history (buyer only)
export const getBuyerBids = async () => {
  const response = await fetch('/api/buyer/auction/my-bids', {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch bid history');
  }
  
  const data = await response.json();
  return data.buyerBids;
};

// Add auction to watchlist (buyer only)
export const addToWatchlist = async (auctionId) => {
  const response = await fetch(`/api/buyer/auction/watchlist/${auctionId}`, {
    method: 'POST',
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add to watchlist');
  }
  
  return response.json();
};

// Remove auction from watchlist (buyer only)
export const removeFromWatchlist = async (auctionId) => {
  const response = await fetch(`/api/buyer/auction/watchlist/${auctionId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to remove from watchlist');
  }
  
  return response.json();
};

// Get buyer's watchlist (buyer only)
export const getBuyerWatchlist = async () => {
  const response = await fetch('/api/buyer/auction/watchlist', {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch watchlist');
  }
  
  const data = await response.json();
  return data.watchlist;
};

// Alias for consistency with import naming
export const getWatchlist = getBuyerWatchlist;