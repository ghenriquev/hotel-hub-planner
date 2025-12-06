import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  const fetchWebsiteData = useCallback(async () => {
    if (!hotelId) {
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
      
      // Cast the data to our interface
      if (data) {
        setWebsiteData(data as unknown as HotelWebsiteData);
        
        // Check if still crawling
        if (data.status === 'crawling') {
          setIsCrawling(true);
        } else {
          setIsCrawling(false);
        }
      } else {
        setWebsiteData(null);
      }
    } catch (error) {
      console.error("Error fetching website data:", error);
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchWebsiteData();
  }, [fetchWebsiteData]);

  // Poll for updates while crawling
  useEffect(() => {
    if (!isCrawling) return;

    const interval = setInterval(() => {
      fetchWebsiteData();
    }, 5000);

    return () => clearInterval(interval);
  }, [isCrawling, fetchWebsiteData]);

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

      toast.success(`Site analisado com sucesso! ${result.pagesCount} páginas extraídas.`);
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
    refetch: fetchWebsiteData,
  };
}
