import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CompetitorData {
  id: string;
  hotel_id: string;
  competitor_url: string;
  competitor_number: number;
  crawled_content: any[] | null;
  crawled_at: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  generated_analysis: string | null;
  analysis_status: string | null;
  llm_model_used: string | null;
  manus_task_id: string | null;
}

export function useHotelCompetitorData(hotelId: string | undefined) {
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCrawling, setIsCrawling] = useState(false);

  const fetchCompetitorData = useCallback(async () => {
    if (!hotelId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("hotel_competitor_data")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("competitor_number", { ascending: true });

      if (error) throw error;
      
      if (data) {
        setCompetitors(data as unknown as CompetitorData[]);
        
        // Check if any is still crawling, generating, or processing with Manus
        const anyProcessing = data.some(c => 
          c.status === 'crawling' || 
          c.status === 'generating' ||
          c.analysis_status === 'generating' ||
          c.analysis_status === 'processing_manus'
        );
        setIsCrawling(anyProcessing);
      } else {
        setCompetitors([]);
      }
    } catch (error) {
      console.error("Error fetching competitor data:", error);
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  // Check Manus task status for competitors processing with Manus
  const checkManusStatus = useCallback(async () => {
    const processingWithManus = competitors.filter(c => 
      c.analysis_status === 'processing_manus' && c.manus_task_id
    );

    if (processingWithManus.length === 0) return;

    console.log(`[useHotelCompetitorData] Checking Manus status for ${processingWithManus.length} competitor(s)`);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    for (const comp of processingWithManus) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manus-check-status`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              hotelId: comp.hotel_id,
              taskId: comp.manus_task_id,
              competitorNumber: comp.competitor_number,
              type: 'competitor'
            }),
          }
        );

        const result = await response.json();
        console.log(`[useHotelCompetitorData] Manus status for competitor ${comp.competitor_number}:`, result.status);

        if (result.status === 'completed') {
          toast.success(`Análise do concorrente ${comp.competitor_number} concluída!`);
        } else if (result.status === 'error') {
          toast.error(`Erro na análise do concorrente ${comp.competitor_number}`);
        }
      } catch (error) {
        console.error(`Error checking Manus status for competitor ${comp.competitor_number}:`, error);
      }
    }

    // Refetch data after checking status
    await fetchCompetitorData();
  }, [competitors, fetchCompetitorData]);

  useEffect(() => {
    fetchCompetitorData();
  }, [fetchCompetitorData]);

  // Poll for updates while processing
  useEffect(() => {
    if (!isCrawling) return;

    // Check if any are processing with Manus
    const hasManusProcessing = competitors.some(c => 
      c.analysis_status === 'processing_manus' && c.manus_task_id
    );

    const interval = setInterval(() => {
      if (hasManusProcessing) {
        checkManusStatus();
      } else {
        fetchCompetitorData();
      }
    }, hasManusProcessing ? 10000 : 5000); // 10s for Manus, 5s for regular

    return () => clearInterval(interval);
  }, [isCrawling, competitors, fetchCompetitorData, checkManusStatus]);

  const crawlCompetitors = async (): Promise<boolean> => {
    if (!hotelId) {
      toast.error("Hotel não encontrado");
      return false;
    }

    setIsCrawling(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Usuário não autenticado");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crawl-competitor-websites`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ hotelId }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Falha ao analisar concorrentes");
      }

      const successCount = result.results?.filter((r: any) => r.success).length || 0;
      
      if (result.mode === 'manus') {
        toast.success(`Análise iniciada no Manus Agent! ${successCount} tarefa(s) criada(s).`);
      } else {
        toast.success(`Concorrentes analisados! ${successCount} site(s) processado(s).`);
      }
      
      await fetchCompetitorData();
      return true;
    } catch (error) {
      console.error("Error crawling competitors:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao analisar concorrentes");
      setIsCrawling(false);
      await fetchCompetitorData();
      return false;
    }
  };

  const hasAnyCompleted = useCallback(() => {
    return competitors.some(c => c.status === 'completed');
  }, [competitors]);

  const getCompletedCount = useCallback(() => {
    return competitors.filter(c => c.status === 'completed').length;
  }, [competitors]);

  const getAnalysisCompletedCount = useCallback(() => {
    return competitors.filter(c => c.analysis_status === 'completed').length;
  }, [competitors]);

  const hasAnyAnalysis = useCallback(() => {
    return competitors.some(c => c.analysis_status === 'completed' && c.generated_analysis);
  }, [competitors]);

  const isProcessingManus = useCallback(() => {
    return competitors.some(c => c.analysis_status === 'processing_manus');
  }, [competitors]);

  return {
    competitors,
    loading,
    isCrawling,
    crawlCompetitors,
    refetch: fetchCompetitorData,
    hasAnyCompleted,
    getCompletedCount,
    getAnalysisCompletedCount,
    hasAnyAnalysis,
    isProcessingManus,
  };
}
