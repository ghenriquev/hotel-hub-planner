import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PublicHotel {
  id: string;
  name: string;
  city: string;
  slug: string;
  category: string | null;
}

export interface PublicAgentResult {
  module_id: number;
  module_title: string;
  output_type: string;
  presentation_url: string | null;
  has_text_result: boolean;
  display_order: number;
}

export function usePublicHotel(slug: string | undefined) {
  const [hotel, setHotel] = useState<PublicHotel | null>(null);
  const [results, setResults] = useState<PublicAgentResult[]>([]);
  const [clienteOcultoUrl, setClienteOcultoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!slug) {
      setLoading(false);
      return;
    }

    try {
      // Fetch hotel by slug
      const { data: hotelData, error: hotelError } = await supabase
        .from("hotels")
        .select("id, name, city, slug, category")
        .eq("slug", slug)
        .single();

      if (hotelError) throw new Error("Hotel não encontrado");
      if (!hotelData) throw new Error("Hotel não encontrado");

      setHotel(hotelData);

      // Fetch agent configs
      const { data: configs } = await supabase
        .from("agent_configs")
        .select("module_id, module_title, output_type, display_order");

      // Fetch completed agent results
      const { data: agentResults } = await supabase
        .from("agent_results")
        .select("module_id, result, presentation_url, status")
        .eq("hotel_id", hotelData.id)
        .eq("status", "completed");

      // Map results with config info
      const mappedResults: PublicAgentResult[] = (agentResults || []).map((r) => {
        const config = configs?.find((c) => c.module_id === r.module_id);
        return {
          module_id: r.module_id,
          module_title: config?.module_title || `Agente ${r.module_id}`,
          output_type: config?.output_type || "text",
          presentation_url: r.presentation_url,
          has_text_result: !!r.result,
          display_order: config?.display_order ?? 999,
        };
      }).sort((a, b) => a.display_order - b.display_order);

      setResults(mappedResults);

      // Fetch cliente oculto material
      const { data: materials } = await supabase
        .from("hotel_materials")
        .select("file_url")
        .eq("hotel_id", hotelData.id)
        .eq("material_type", "cliente_oculto")
        .single();

      if (materials?.file_url) {
        setClienteOcultoUrl(materials.file_url);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
      setHotel(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { hotel, results, clienteOcultoUrl, loading, error };
}
