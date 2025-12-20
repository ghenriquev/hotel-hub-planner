import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ManualDataHistoryEntry {
  id: string;
  hotel_manual_data_id: string;
  hotel_id: string;
  edited_by: string | null;
  edited_at: string;
  changes: Record<string, any>;
  previous_values: Record<string, any>;
  edit_type: string;
}

export function useManualDataHistory(hotelId: string | undefined) {
  const [history, setHistory] = useState<ManualDataHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!hotelId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('hotel_manual_data_history')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('edited_at', { ascending: false });

      if (error) {
        console.error('Error fetching history:', error);
        return;
      }

      setHistory((data || []) as ManualDataHistoryEntry[]);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const addHistoryEntry = async (
    manualDataId: string,
    changes: Record<string, any>,
    previousValues: Record<string, any>,
    editType: string = 'update'
  ) => {
    if (!hotelId) return false;

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('hotel_manual_data_history')
        .insert({
          hotel_manual_data_id: manualDataId,
          hotel_id: hotelId,
          edited_by: userData?.user?.id || null,
          changes,
          previous_values: previousValues,
          edit_type: editType
        });

      if (error) throw error;

      await fetchHistory();
      return true;
    } catch (err) {
      console.error('Error adding history entry:', err);
      return false;
    }
  };

  return {
    history,
    loading,
    addHistoryEntry,
    refetch: fetchHistory
  };
}
