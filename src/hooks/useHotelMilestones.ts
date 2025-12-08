import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addDays, format } from 'date-fns';

export interface HotelMilestone {
  id: string;
  hotel_id: string;
  milestone_key: string;
  name: string;
  start_week: number;
  end_week: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface MilestoneInput {
  milestone_key: string;
  name: string;
  start_week: number;
  end_week: number;
  start_date: string;
  end_date: string;
}

const DEFAULT_MILESTONES = [
  { key: 'etapa1', name: 'Etapa 1 – Kickoff & Alinhamento', startWeek: 1, endWeek: 1 },
  { key: 'etapa2', name: 'Etapa 2 – Estratégia', startWeek: 2, endWeek: 3 },
  { key: 'etapa3', name: 'Etapa 3 – Construção', startWeek: 4, endWeek: 5 },
  { key: 'etapa4', name: 'Etapa 4 – Ativação e Mensuração', startWeek: 6, endWeek: 7 },
  { key: 'etapa5', name: 'Etapa 5 – Relatório Final e Proposta de Continuidade', startWeek: 8, endWeek: 8 },
];

export function useHotelMilestones(hotelId: string | undefined) {
  const [milestones, setMilestones] = useState<HotelMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMilestones = useCallback(async () => {
    if (!hotelId) {
      setMilestones([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('hotel_milestones')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('start_week', { ascending: true });

      if (fetchError) throw fetchError;
      setMilestones(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching milestones:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar cronograma');
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const createDefaultMilestones = useCallback(async (startDate: Date): Promise<boolean> => {
    if (!hotelId) return false;

    try {
      // Delete existing milestones first
      await supabase
        .from('hotel_milestones')
        .delete()
        .eq('hotel_id', hotelId);

      // Create new milestones based on start date
      const milestonesToInsert = DEFAULT_MILESTONES.map(m => ({
        hotel_id: hotelId,
        milestone_key: m.key,
        name: m.name,
        start_week: m.startWeek,
        end_week: m.endWeek,
        start_date: format(addDays(startDate, (m.startWeek - 1) * 7), 'yyyy-MM-dd'),
        end_date: format(addDays(startDate, m.endWeek * 7 - 1), 'yyyy-MM-dd'),
      }));

      const { error: insertError } = await supabase
        .from('hotel_milestones')
        .insert(milestonesToInsert);

      if (insertError) throw insertError;
      
      await fetchMilestones();
      return true;
    } catch (err) {
      console.error('Error creating milestones:', err);
      toast.error('Erro ao criar cronograma');
      return false;
    }
  }, [hotelId, fetchMilestones]);

  const updateMilestone = useCallback(async (
    milestoneKey: string,
    updates: Partial<MilestoneInput>
  ): Promise<boolean> => {
    if (!hotelId) return false;

    try {
      const { error: updateError } = await supabase
        .from('hotel_milestones')
        .update(updates)
        .eq('hotel_id', hotelId)
        .eq('milestone_key', milestoneKey);

      if (updateError) throw updateError;
      
      await fetchMilestones();
      return true;
    } catch (err) {
      console.error('Error updating milestone:', err);
      toast.error('Erro ao atualizar cronograma');
      return false;
    }
  }, [hotelId, fetchMilestones]);

  // Convert to legacy format for GanttChart compatibility
  const milestonesLegacy = milestones.map(m => ({
    id: m.milestone_key,
    name: m.name,
    startWeek: m.start_week,
    endWeek: m.end_week,
    startDate: m.start_date,
    endDate: m.end_date,
  }));

  return {
    milestones,
    milestonesLegacy,
    loading,
    error,
    fetchMilestones,
    createDefaultMilestones,
    updateMilestone,
  };
}
