// Legacy interface for compatibility with existing components
export interface LegacyAuctionItem {
  id: string;
  title: string;
  artisan: string;
  currentBid: number;
  bidCount: number;
  timeRemaining: string;
  imageUrl: string;
  isLive: boolean;
}

// User interface matching backend User model
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
  avatar?: string;
  shopName?: string;
  shopDescription?: string;
  sellerRating?: number;
  totalSales?: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Auction interface matching backend Auction model
export interface AuctionItem {
  _id: string;
  title: string;
  description: string;
  category: Category | string;
  subcategory?: string;
  images: Array<{
    url: string;
    publicId?: string;
    alt?: string;
  }>;
  startingPrice: number;
  currentPrice: number;
  reservePrice?: number;
  buyNowPrice?: number;
  startTime: string;
  endTime: string;
  duration: number;
  seller: User | string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  materials?: string[];
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
    unit: 'cm' | 'inches';
  };
  origin?: {
    country?: string;
    region?: string;
    artisan?: string;
  };
  tags?: string[];
  status: 'draft' | 'scheduled' | 'active' | 'ended' | 'cancelled' | 'sold';
  totalBids: number;
  winner?: User | string;
  views: number;
  featured: boolean;
  shipping: {
    method: 'standard' | 'express' | 'overnight' | 'pickup';
    cost: number;
    freeShipping: boolean;
    international: boolean;
    handlingTime: number;
  };
  createdAt: string;
  updatedAt: string;
  
  // Virtual fields
  timeRemaining?: number;
  isEndingSoon?: boolean;
  reserveMet?: boolean;
}

// Category interface matching backend Category model
export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: {
    url: string;
    publicId?: string;
    alt?: string;
  };
  parent?: Category | string;
  level: number;
  path: string;
  subcategories?: Array<{
    name: string;
    slug: string;
    description?: string;
    icon?: string;
  }>;
  isActive: boolean;
  sortOrder: number;
  featured: boolean;
  totalAuctions: number;
  activeAuctions: number;
  createdAt: string;
  updatedAt: string;
}

// Bid interface for bidding functionality
export interface Bid {
  _id: string;
  auction: AuctionItem | string;
  bidder: User | string;
  amount: number;
  bidTime: string;
  isMaxBid: boolean;
  maxBidAmount?: number;
  status: 'active' | 'outbid' | 'winning' | 'won' | 'lost';
  createdAt: string;
  updatedAt: string;
}

export interface BidFormData {
  amount: number;
  isMaxBid: boolean;
}

export interface NotificationData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}
