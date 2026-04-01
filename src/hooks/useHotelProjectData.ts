import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface HotelProjectData {
  id: string;
  hotel_id: string;
  meeting_kickoff_url: string | null;
  meeting_phase1_url: string | null;
  meeting_phase2_url: string | null;
  meeting_final_url: string | null;
  phase1_presentation_url: string | null;
  phase2_summary: string | null;
  phase2_presentation_url: string | null;
  phase2_status: string | null;
  phase2_generated_at: string | null;
  phase34_deliverables: Record<string, any>;
  phase5_report: string | null;
  phase5_presentation_url: string | null;
  phase5_status: string | null;
  phase5_generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useHotelProjectData(hotelId: string | undefined) {
  const [projectData, setProjectData] = useState<HotelProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!hotelId) { setLoading(false); return; }
    
    try {
      const { data, error } = await (supabase as any)
        .from("hotel_project_data")
        .select("*")
        .eq("hotel_id", hotelId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching project data:", error);
      }
      setProjectData(data as HotelProjectData | null);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateProjectData = async (updates: Partial<HotelProjectData>) => {
    if (!hotelId) return false;
    setSaving(true);
    try {
      if (projectData) {
        const { error } = await (supabase as any)
          .from("hotel_project_data")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("hotel_id", hotelId);
        if (error) throw error;
        setProjectData(prev => prev ? { ...prev, ...updates } : null);
      } else {
        const { data, error } = await (supabase as any)
          .from("hotel_project_data")
          .insert({ hotel_id: hotelId, ...updates })
          .select()
          .single();
        if (error) throw error;
        setProjectData(data as HotelProjectData);
      }
      return true;
    } catch (err) {
      console.error("Error updating project data:", err);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { projectData, loading, saving, updateProjectData, refetch: fetchData };
}
