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
        
        // Check if any is still crawling or generating analysis
        const anyCrawling = data.some(c => c.status === 'crawling' || c.analysis_status === 'generating');
        setIsCrawling(anyCrawling);
      } else {
        setCompetitors([]);
      }
    } catch (error) {
      console.error("Error fetching competitor data:", error);
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchCompetitorData();
  }, [fetchCompetitorData]);

  // Poll for updates while crawling
  useEffect(() => {
    if (!isCrawling) return;

    const interval = setInterval(() => {
      fetchCompetitorData();
    }, 5000);

    return () => clearInterval(interval);
  }, [isCrawling, fetchCompetitorData]);

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
      toast.success(`Concorrentes analisados! ${successCount} site(s) extraído(s).`);
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
  };
}
