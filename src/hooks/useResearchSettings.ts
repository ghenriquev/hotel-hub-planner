import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ResearchSettings {
  id: string;
  competitor_max_pages: number;
  competitor_max_depth: number;
  competitor_crawler_type: string;
  website_max_pages: number;
  website_max_depth: number;
  website_crawler_type: string;
  reviews_max_months: number;
}

export type ResearchSettingsUpdate = Partial<Omit<ResearchSettings, 'id'>>;

const DEFAULT_SETTINGS: ResearchSettingsUpdate = {
  competitor_max_pages: 8,
  competitor_max_depth: 2,
  competitor_crawler_type: 'playwright:firefox',
  website_max_pages: 10,
  website_max_depth: 2,
  website_crawler_type: 'playwright:firefox',
  reviews_max_months: 24,
};

export function useResearchSettings() {
  const [settings, setSettings] = useState<ResearchSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('research_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data as ResearchSettings);
      } else {
        // Create default settings if none exist
        const { data: newData, error: insertError } = await supabase
          .from('research_settings')
          .insert({})
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newData as ResearchSettings);
      }
    } catch (error) {
      console.error('Error fetching research settings:', error);
      toast.error('Erro ao carregar configurações de pesquisa');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (updates: ResearchSettingsUpdate) => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('research_settings')
        .update(updates)
        .eq('id', settings.id);

      if (error) throw error;

      setSettings({ ...settings, ...updates });
      toast.success('Configurações de pesquisa salvas');
    } catch (error) {
      console.error('Error updating research settings:', error);
      toast.error('Erro ao salvar configurações de pesquisa');
    } finally {
      setSaving(false);
    }
  };

  return {
    settings,
    loading,
    saving,
    updateSettings,
    refetch: fetchSettings,
  };
}
