import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AgentResult {
  id: string;
  hotel_id: string;
  module_id: number;
  result: string | null;
  presentation_url: string | null;
  status: 'pending' | 'generating' | 'completed' | 'error';
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

  return { result, loading, refetch: fetchResult };
}