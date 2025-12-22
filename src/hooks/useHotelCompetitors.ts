import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Competitor {
  id?: string;
  hotel_id: string;
  competitor_url: string;
  competitor_number: number;
  status?: string;
  analysis_status?: string;
}

const MIN_COMPETITORS = 3;

export function useHotelCompetitors(hotelId: string | undefined) {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize with 3 empty competitors
  const initializeEmptyCompetitors = useCallback((hId: string): Competitor[] => {
    return Array.from({ length: MIN_COMPETITORS }, (_, i) => ({
      hotel_id: hId,
      competitor_url: "",
      competitor_number: i + 1,
    }));
  }, []);

  const fetchCompetitors = useCallback(async () => {
    if (!hotelId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("hotel_competitor_data")
        .select("id, hotel_id, competitor_url, competitor_number, status, analysis_status")
        .eq("hotel_id", hotelId)
        .order("competitor_number", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Ensure we have at least MIN_COMPETITORS entries
        const mapped: Competitor[] = data.map(d => ({
          id: d.id,
          hotel_id: d.hotel_id,
          competitor_url: d.competitor_url,
          competitor_number: d.competitor_number,
          status: d.status || undefined,
          analysis_status: d.analysis_status || undefined,
        }));

        // Fill missing slots up to MIN_COMPETITORS
        const existing = new Set(mapped.map(c => c.competitor_number));
        for (let i = 1; i <= MIN_COMPETITORS; i++) {
          if (!existing.has(i)) {
            mapped.push({
              hotel_id: hotelId,
              competitor_url: "",
              competitor_number: i,
            });
          }
        }
        
        // Sort by competitor_number
        mapped.sort((a, b) => a.competitor_number - b.competitor_number);
        setCompetitors(mapped);
      } else {
        setCompetitors(initializeEmptyCompetitors(hotelId));
      }
    } catch (error) {
      console.error("Error fetching competitors:", error);
      setCompetitors(initializeEmptyCompetitors(hotelId));
    } finally {
      setLoading(false);
    }
  }, [hotelId, initializeEmptyCompetitors]);

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  const updateCompetitor = useCallback((index: number, url: string) => {
    setCompetitors(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], competitor_url: url };
      }
      return updated;
    });
  }, []);

  const addCompetitor = useCallback(() => {
    if (!hotelId) return;
    
    setCompetitors(prev => {
      const nextNumber = prev.length > 0 
        ? Math.max(...prev.map(c => c.competitor_number)) + 1 
        : 1;
      return [
        ...prev,
        {
          hotel_id: hotelId,
          competitor_url: "",
          competitor_number: nextNumber,
        }
      ];
    });
  }, [hotelId]);

  const removeCompetitor = useCallback(async (index: number) => {
    const competitor = competitors[index];
    if (!competitor) return;

    // Don't allow removing if we're at minimum
    if (competitors.length <= MIN_COMPETITORS) {
      // Just clear the URL instead
      updateCompetitor(index, "");
      return;
    }

    // If it has an ID, delete from database
    if (competitor.id) {
      try {
        const { error } = await supabase
          .from("hotel_competitor_data")
          .delete()
          .eq("id", competitor.id);

        if (error) throw error;
      } catch (error) {
        console.error("Error deleting competitor:", error);
        toast.error("Erro ao remover concorrente");
        return;
      }
    }

    setCompetitors(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      // Renumber remaining competitors
      return filtered.map((c, i) => ({ ...c, competitor_number: i + 1 }));
    });
  }, [competitors, updateCompetitor]);

  const saveCompetitors = useCallback(async (): Promise<boolean> => {
    if (!hotelId) return false;
    
    setIsSaving(true);
    
    try {
      // Get current data from DB
      const { data: existingData, error: fetchError } = await supabase
        .from("hotel_competitor_data")
        .select("id, competitor_number")
        .eq("hotel_id", hotelId);

      if (fetchError) throw fetchError;

      const existingMap = new Map((existingData || []).map(d => [d.competitor_number, d.id]));
      
      // Process each competitor
      for (const comp of competitors) {
        const existingId = existingMap.get(comp.competitor_number);
        const hasUrl = comp.competitor_url && comp.competitor_url.trim() !== "";

        if (existingId) {
          if (hasUrl) {
            // Update existing
            const { error } = await supabase
              .from("hotel_competitor_data")
              .update({ 
                competitor_url: comp.competitor_url.trim(),
                updated_at: new Date().toISOString()
              })
              .eq("id", existingId);
            
            if (error) throw error;
          } else {
            // Delete if URL is empty
            const { error } = await supabase
              .from("hotel_competitor_data")
              .delete()
              .eq("id", existingId);
            
            if (error) throw error;
          }
        } else if (hasUrl) {
          // Insert new
          const { error } = await supabase
            .from("hotel_competitor_data")
            .insert({
              hotel_id: hotelId,
              competitor_url: comp.competitor_url.trim(),
              competitor_number: comp.competitor_number,
              status: "pending",
              analysis_status: "pending"
            });
          
          if (error) throw error;
        }
      }

      // Delete any extras that were removed
      const currentNumbers = new Set(competitors.map(c => c.competitor_number));
      for (const [num, id] of existingMap) {
        if (!currentNumbers.has(num)) {
          await supabase.from("hotel_competitor_data").delete().eq("id", id);
        }
      }

      await fetchCompetitors();
      return true;
    } catch (error) {
      console.error("Error saving competitors:", error);
      toast.error("Erro ao salvar concorrentes");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [hotelId, competitors, fetchCompetitors]);

  const getFilledCount = useCallback(() => {
    return competitors.filter(c => c.competitor_url && c.competitor_url.trim() !== "").length;
  }, [competitors]);

  return {
    competitors,
    loading,
    isSaving,
    updateCompetitor,
    addCompetitor,
    removeCompetitor,
    saveCompetitors,
    getFilledCount,
    refetch: fetchCompetitors,
  };
}
