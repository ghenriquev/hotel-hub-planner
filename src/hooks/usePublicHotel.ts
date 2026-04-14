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
  pdf_url: string | null;
  has_text_result: boolean;
  display_order: number;
}

export interface PublicProjectData {
  meeting_kickoff_url: string | null;
  meeting_phase1_url: string | null;
  meeting_phase2_url: string | null;
  meeting_final_url: string | null;
  phase1_presentation_url: string | null;
  phase2_presentation_url: string | null;
  phase2_status: string | null;
  phase34_deliverables: any | null;
  phase5_presentation_url: string | null;
  phase5_status: string | null;
}

export function usePublicHotel(slug: string | undefined) {
  const [hotel, setHotel] = useState<PublicHotel | null>(null);
  const [results, setResults] = useState<PublicAgentResult[]>([]);
  const [clienteOcultoUrl, setClienteOcultoUrl] = useState<string | null>(null);
  const [projectData, setProjectData] = useState<PublicProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!slug) {
      setLoading(false);
      return;
    }

    try {
      const { data: hotelData, error: hotelError } = await supabase
        .from("hotels")
        .select("id, name, city, slug, category")
        .eq("slug", slug)
        .single();

      if (hotelError) throw new Error("Hotel não encontrado");
      if (!hotelData) throw new Error("Hotel não encontrado");

      setHotel(hotelData);

      // Fetch configs, results, materials, and project data in parallel
      const [configsRes, agentResultsRes, materialsRes, projectRes] = await Promise.all([
        supabase.from("agent_configs").select("module_id, module_title, output_type, display_order"),
        supabase.from("agent_results").select("module_id, result, presentation_url, pdf_url, status").eq("hotel_id", hotelData.id).eq("status", "completed"),
        supabase.from("hotel_materials").select("file_url").eq("hotel_id", hotelData.id).eq("material_type", "cliente_oculto").maybeSingle(),
        supabase.from("hotel_project_data").select("meeting_kickoff_url, meeting_phase1_url, meeting_phase2_url, meeting_final_url, phase1_presentation_url, phase2_presentation_url, phase2_status, phase34_deliverables, phase5_presentation_url, phase5_status").eq("hotel_id", hotelData.id).maybeSingle(),
      ]);

      const agentResults = agentResultsRes.data || [];
      const agentConfigs = configsRes.data || [];
      const resultModuleIds = new Set(agentResults.map((r) => r.module_id));

      // Map existing completed results (preserves presentation_url — original behavior)
      const fromResults: PublicAgentResult[] = agentResults.map((r) => {
        const config = agentConfigs.find((c) => c.module_id === r.module_id);
        return {
          module_id: r.module_id,
          module_title: config?.module_title || (r.module_id === 9999 ? "Visão Geral do Posicionamento" : `Agente ${r.module_id}`),
          output_type: config?.output_type || "text",
          presentation_url: r.presentation_url,
          pdf_url: r.pdf_url ?? null,
          has_text_result: !!r.result,
          display_order: config?.display_order ?? 999,
        };
      });

      // Add "Em breve" slots for configured modules that have no result yet
      const fromConfigsOnly: PublicAgentResult[] = agentConfigs
        .filter((config) => !resultModuleIds.has(config.module_id))
        .map((config) => ({
          module_id: config.module_id,
          module_title: config.module_title,
          output_type: config.output_type || "text",
          presentation_url: null,
          pdf_url: null,
          has_text_result: false,
          display_order: config.display_order ?? 999,
        }));

      const mappedResults = [...fromResults, ...fromConfigsOnly]
        .sort((a, b) => a.display_order - b.display_order);

      setResults(mappedResults);

      if (materialsRes.data?.file_url) {
        setClienteOcultoUrl(materialsRes.data.file_url);
      }

      if (projectRes.data) {
        setProjectData(projectRes.data);
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

  return { hotel, results, clienteOcultoUrl, projectData, loading, error };
}
