import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const WEBSITE_POLLING_INTERVAL_MS = 5000;
const WEBSITE_POLLING_TIMEOUT_MS = 10 * 60 * 1000;
const WEBSITE_TIMEOUT_MESSAGE = "Timeout - análise travada. Tente novamente.";

export interface HotelWebsiteData {
  id: string;
  hotel_id: string;
  website_url: string;
  crawled_content: any[] | null;
  crawled_at: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export function useHotelWebsiteData(hotelId: string | undefined) {
  const [websiteData, setWebsiteData] = useState<HotelWebsiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCrawling, setIsCrawling] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingStateRef = useRef<{ runId: string; startedAt: number; inFlight: boolean } | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    pollingStateRef.current = null;
  }, []);

  const fetchWebsiteData = useCallback(async () => {
    if (!hotelId) {
      stopPolling();
      setIsCrawling(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("hotel_website_data")
        .select("*")
        .eq("hotel_id", hotelId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setWebsiteData(data as unknown as HotelWebsiteData);
        
        if (data.status === 'crawling') {
          setIsCrawling(true);
          
          // If we have an apify run ID, poll via edge function
          const errorMsg = data.error_message as string | null;
          if (errorMsg && errorMsg.startsWith('apify_run:')) {
            const runId = errorMsg.replace('apify_run:', '').trim();
            const currentRun = pollingStateRef.current?.runId;

            if (runId && currentRun !== runId) {
              pollApifyStatus(hotelId, runId);
            }
          }
        } else {
          setIsCrawling(false);
          stopPolling();
        }
      } else {
        setWebsiteData(null);
      }
    } catch (error) {
      console.error("Error fetching website data:", error);
    } finally {
      setLoading(false);
    }
  }, [hotelId, stopPolling]);

  const pollApifyStatus = useCallback(async (hId: string, runId: string) => {
    stopPolling();
    pollingStateRef.current = {
      runId,
      startedAt: Date.now(),
      inFlight: false,
    };

    const checkStatus = async () => {
      const currentPoll = pollingStateRef.current;
      if (!currentPoll || currentPoll.runId !== runId || currentPoll.inFlight) {
        return;
      }

      if (Date.now() - currentPoll.startedAt > WEBSITE_POLLING_TIMEOUT_MS) {
        await supabase
          .from("hotel_website_data")
          .update({ status: 'error', error_message: WEBSITE_TIMEOUT_MESSAGE })
          .eq("hotel_id", hId)
          .eq("status", "crawling");

        toast.error(WEBSITE_TIMEOUT_MESSAGE);
        stopPolling();
        setIsCrawling(false);
        await fetchWebsiteData();
        return;
      }

      currentPoll.inFlight = true;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error("Sessão expirada. Faça login novamente.");
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crawl-hotel-website`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ 
              hotelId: hId, 
              action: 'check-status', 
              apifyRunId: runId 
            }),
          }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok || result?.success === false) {
          const errorMessage = result?.error || `Falha ao consultar status (${response.status})`;

          await supabase
            .from("hotel_website_data")
            .update({ status: 'error', error_message: errorMessage })
            .eq("hotel_id", hId)
            .eq("status", "crawling");

          toast.error(errorMessage);
          stopPolling();
          setIsCrawling(false);
          await fetchWebsiteData();
          return;
        }
        
        if (result.status === 'completed') {
          toast.success(`Site analisado com sucesso! ${result.pagesCount} páginas extraídas.`);
          stopPolling();
          setIsCrawling(false);
          await fetchWebsiteData();
        } else if (result.status === 'error') {
          toast.error(result.error || "Erro ao analisar site");
          stopPolling();
          setIsCrawling(false);
          await fetchWebsiteData();
        }
        // If still crawling, continue polling
      } catch (error) {
        console.error("Error polling status:", error);
        const message = error instanceof Error ? error.message : "Erro ao verificar status da análise";

        await supabase
          .from("hotel_website_data")
          .update({ status: 'error', error_message: message })
          .eq("hotel_id", hId)
          .eq("status", "crawling");

        toast.error(message);
        stopPolling();
        setIsCrawling(false);
        await fetchWebsiteData();
      } finally {
        if (pollingStateRef.current?.runId === runId) {
          pollingStateRef.current.inFlight = false;
        }
      }
    };

    // Check immediately, then every 10 seconds
    await checkStatus();
    if (pollingStateRef.current?.runId === runId) {
      pollingRef.current = setInterval(checkStatus, WEBSITE_POLLING_INTERVAL_MS);
    }
  }, [fetchWebsiteData, stopPolling]);

  useEffect(() => {
    fetchWebsiteData();
    return () => {
      stopPolling();
    };
  }, [fetchWebsiteData, stopPolling]);

  const cancelCrawl = useCallback(async () => {
    stopPolling();

    setIsCrawling(false);

    // Update DB status to cancelled
    if (hotelId) {
      try {
        await supabase
          .from("hotel_website_data")
          .update({ status: 'error', error_message: 'Análise cancelada pelo usuário' })
          .eq("hotel_id", hotelId)
          .eq("status", "crawling");

        await fetchWebsiteData();
        toast.info("Análise do site cancelada.");
      } catch (error) {
        console.error("Error cancelling crawl:", error);
      }
    }
  }, [hotelId, fetchWebsiteData, stopPolling]);

  const crawlWebsite = async (websiteUrl: string): Promise<boolean> => {
    if (!hotelId || !websiteUrl) {
      toast.error("URL do site é obrigatória");
      return false;
    }

    setIsCrawling(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Usuário não autenticado");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crawl-hotel-website`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ hotelId, websiteUrl }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Falha ao analisar site");
      }

      toast.success("Análise do site iniciada! Acompanhe o progresso.");
      
      // Start polling if we got a run ID
      if (result.runId) {
        pollApifyStatus(hotelId, result.runId);
      }
      
      await fetchWebsiteData();
      return true;
    } catch (error) {
      console.error("Error crawling website:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao analisar site");
      setIsCrawling(false);
      await fetchWebsiteData();
      return false;
    }
  };

  return {
    websiteData,
    loading,
    isCrawling,
    crawlWebsite,
    cancelCrawl,
    refetch: fetchWebsiteData,
  };
}
