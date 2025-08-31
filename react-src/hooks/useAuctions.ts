/**
 * Custom hooks for fetching and managing auction data
 * Provides state management and error handling for auction operations
 */

import { useState, useEffect } from 'react';
import { AuctionItem } from '../types';
import { auctionService } from '../services/auctionService';

// Hook for fetching featured auctions
export const useFeaturedAuctions = () => {
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedAuctions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await auctionService.getFeaturedAuctions();
        setAuctions(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch featured auctions');
        console.error('Error fetching featured auctions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedAuctions();
  }, []);

  return { auctions, loading, error, refetch: () => window.location.reload() };
};

// Hook for fetching auctions ending soon
export const useEndingSoonAuctions = () => {
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEndingSoonAuctions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await auctionService.getEndingSoonAuctions();
        setAuctions(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch ending soon auctions');
        console.error('Error fetching ending soon auctions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEndingSoonAuctions();
  }, []);

  return { auctions, loading, error, refetch: () => window.location.reload() };
};

// Hook for fetching all auctions with filters
export const useAuctions = (params?: {
  category?: string;
  status?: string;
  featured?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    pages: number;
    total: number;
    limit: number;
  } | null>(null);

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await auctionService.getAuctions(params);
        setAuctions(response.data);
        setPagination(response.pagination || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch auctions');
        console.error('Error fetching auctions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, [JSON.stringify(params)]); // Re-run when params change

  const refetch = () => {
    setLoading(true);
    setError(null);
    // Trigger useEffect by updating a dependency
  };

  return { auctions, loading, error, pagination, refetch };
};

// Hook for fetching a single auction
export const useAuction = (id: string | null) => {
  const [auction, setAuction] = useState<AuctionItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setAuction(null);
      setLoading(false);
      return;
    }

    const fetchAuction = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await auctionService.getAuction(id);
        setAuction(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch auction');
        console.error('Error fetching auction:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuction();
  }, [id]);

  return { auction, loading, error, refetch: () => id && window.location.reload() };
};

// Hook for auction search functionality
export const useAuctionSearch = () => {
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchAuctions = async (query: string, filters?: {
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    if (!query.trim()) {
      setAuctions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await auctionService.searchAuctions(query, filters);
      setAuctions(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      console.error('Error searching auctions:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setAuctions([]);
    setError(null);
  };

  return { auctions, loading, error, searchAuctions, clearSearch };
};
