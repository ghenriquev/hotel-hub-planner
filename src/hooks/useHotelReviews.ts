import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ReviewData {
  id: string;
  hotel_id: string;
  source: 'google' | 'tripadvisor' | 'booking';
  source_url: string | null;
  status: 'pending' | 'crawling' | 'completed' | 'error';
  reviews_count: number;
  reviews_data: any[] | null;
  crawled_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  // Progress tracking fields
  crawl_progress: number;
  items_collected: number;
  progress_message: string | null;
}

export function useHotelReviews(hotelId: string | undefined) {
  const [reviewsData, setReviewsData] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviewsData = useCallback(async () => {
    if (!hotelId) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('hotel_reviews_data')
        .select('*')
        .eq('hotel_id', hotelId);

      if (fetchError) throw fetchError;

      setReviewsData((data as ReviewData[]) || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching reviews data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchReviewsData();
  }, [fetchReviewsData]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!hotelId) return;

    const channel = supabase
      .channel(`hotel-reviews-${hotelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hotel_reviews_data',
          filter: `hotel_id=eq.${hotelId}`,
        },
        () => {
          fetchReviewsData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hotelId, fetchReviewsData]);

  const crawlReviews = async (source: 'google' | 'tripadvisor' | 'booking' | 'all') => {
    if (!hotelId) return;

    try {
      setCrawling(true);
      setError(null);

      const { data, error: invokeError } = await supabase.functions.invoke('crawl-hotel-reviews', {
        body: { hotelId, source },
      });

      if (invokeError) throw invokeError;

      // Refresh data after crawl
      await fetchReviewsData();

      return data;
    } catch (err) {
      console.error('Error crawling reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to crawl reviews');
      throw err;
    } finally {
      setCrawling(false);
    }
  };

  const getSourceData = (source: 'google' | 'tripadvisor' | 'booking'): ReviewData | undefined => {
    return reviewsData.find(r => r.source === source);
  };

  const getTotalReviewsCount = (): number => {
    return reviewsData.reduce((sum, r) => sum + (r.reviews_count || 0), 0);
  };

  const getLastCrawledAt = (): string | null => {
    const crawledDates = reviewsData
      .filter(r => r.crawled_at)
      .map(r => new Date(r.crawled_at!).getTime());
    
    if (crawledDates.length === 0) return null;
    
    return new Date(Math.max(...crawledDates)).toISOString();
  };

  const hasAnyCompleted = (): boolean => {
    return reviewsData.some(r => r.status === 'completed');
  };

  const isAnyCrawling = (): boolean => {
    return reviewsData.some(r => r.status === 'crawling');
  };

  return {
    reviewsData,
    loading,
    crawling,
    error,
    crawlReviews,
    getSourceData,
    getTotalReviewsCount,
    getLastCrawledAt,
    hasAnyCompleted,
    isAnyCrawling,
    refetch: fetchReviewsData,
  };
}
