export interface AuctionItem {
  id: string;
  title: string;
  artisan?: string;
  seller?: string;
  currentBid: number;
  bidCount: number;
  timeRemaining?: string;
  timeLeft?: string;
  imageUrl?: string;
  image?: string;
  isLive?: boolean;
  category?: string;
  condition?: string;
  watchers?: number;
  startingBid?: number;
  endTime?: string;
  isHot?: boolean;
  reserveMet?: boolean;
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
