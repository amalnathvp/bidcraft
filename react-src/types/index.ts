export interface AuctionItem {
  id: string;
  title: string;
  artisan: string;
  currentBid: number;
  bidCount: number;
  timeRemaining: string;
  imageUrl: string;
  isLive: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  icon: string;
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
