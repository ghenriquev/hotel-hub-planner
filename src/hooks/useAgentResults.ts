import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AgentResult {
  id: string;
  hotel_id: string;
  module_id: number;
  result: string | null;
  presentation_url: string | null;
  presentation_status: 'generating' | 'completed' | 'error' | null;
  llm_model_used: string | null;
  status: 'pending' | 'generating' | 'completed' | 'error' | 'processing_manus';
  generated_at: string | null;
  created_at: string;
}

export function useAgentResults(hotelId: string) {
  const [results, setResults] = useState<AgentResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResults = useCallback(async () => {
    if (!hotelId) return;
    
    const { data, error } = await supabase
      .from('agent_results')
      .select('*')
      .eq('hotel_id', hotelId);

    if (error) {
      console.error('Error fetching agent results:', error);
      return;
    }

    setResults((data || []) as AgentResult[]);
    setLoading(false);
  }, [hotelId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Realtime subscription for live updates during batch generation
  useEffect(() => {
    if (!hotelId) return;
    const channel = supabase
      .channel(`agent-results-${hotelId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agent_results',
        filter: `hotel_id=eq.${hotelId}`,
      }, () => {
        fetchResults();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [hotelId, fetchResults]);

  const getResultForModule = useCallback((moduleId: number): AgentResult | undefined => {
    return results.find(r => r.module_id === moduleId);
  }, [results]);

  return { results, loading, refetch: fetchResults, getResultForModule };
}

export function useAgentResult(hotelId: string, moduleId: number) {
  const [result, setResult] = useState<AgentResult | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchResult = useCallback(async () => {
    if (!hotelId || moduleId === undefined) return;
    
    const { data, error } = await supabase
      .from('agent_results')
      .select('*')
      .eq('hotel_id', hotelId)
      .eq('module_id', moduleId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching agent result:', error);
      return;
    }

    setResult(data as AgentResult | null);
    setLoading(false);
  }, [hotelId, moduleId]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  // Realtime subscription for live updates
  useEffect(() => {
    if (!hotelId || moduleId === undefined) return;
    const channel = supabase
      .channel(`agent-result-${hotelId}-${moduleId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agent_results',
        filter: `hotel_id=eq.${hotelId}`,
      }, () => {
        fetchResult();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [hotelId, moduleId, fetchResult]);

  return { result, loading, refetch: fetchResult };
}