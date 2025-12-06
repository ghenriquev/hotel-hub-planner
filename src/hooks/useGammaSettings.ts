import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GammaSettings {
  id: string;
  // Layout settings
  theme_id: string;
  num_cards: number;
  card_split: string;
  text_mode: string;
  format: string;
  additional_instructions: string;
  // Text options
  text_amount: string;
  text_tone: string;
  text_audience: string;
  text_language: string;
  // Image options
  image_source: string;
  image_model: string;
  image_style: string;
  // Card options
  card_dimensions: string;
  // Timestamps
  created_at: string | null;
  updated_at: string | null;
}

export type GammaSettingsUpdate = Partial<Omit<GammaSettings, 'id' | 'created_at' | 'updated_at'>>;

// Theme options from Gamma API
export const GAMMA_THEMES = [
  { value: 'Oasis', label: 'Oasis', description: 'Clean e moderno' },
  { value: 'Chisel', label: 'Chisel', description: 'Profissional e corporativo' },
  { value: 'Sleek', label: 'Sleek', description: 'Minimalista elegante' },
  { value: 'Bold', label: 'Bold', description: 'Cores vibrantes' },
  { value: 'Classic', label: 'Classic', description: 'Tradicional e sóbrio' },
];

export const GAMMA_FORMATS = [
  { value: 'presentation', label: 'Apresentação' },
  { value: 'document', label: 'Documento' },
  { value: 'webpage', label: 'Página Web' },
];

export const GAMMA_TEXT_MODES = [
  { value: 'generate', label: 'Gerar', description: 'IA gera texto a partir do conteúdo' },
  { value: 'condense', label: 'Condensar', description: 'Resume o texto fornecido' },
  { value: 'preserve', label: 'Preservar', description: 'Mantém o texto original' },
];

export const GAMMA_CARD_SPLITS = [
  { value: 'auto', label: 'Automático', description: 'IA decide a divisão' },
  { value: 'inputTextBreaks', label: 'Quebras de Texto', description: 'Usa quebras do input' },
];

export const GAMMA_TEXT_AMOUNTS = [
  { value: 'brief', label: 'Breve', description: 'Texto mínimo' },
  { value: 'medium', label: 'Médio', description: 'Texto moderado' },
  { value: 'detailed', label: 'Detalhado', description: 'Mais texto por card' },
  { value: 'extensive', label: 'Extenso', description: 'Texto completo' },
];

export const GAMMA_IMAGE_SOURCES = [
  { value: 'aiGenerated', label: 'Geradas por IA', description: 'Imagens criadas automaticamente' },
  { value: 'none', label: 'Sem Imagens', description: 'Não usar imagens' },
];

export const GAMMA_IMAGE_MODELS = [
  { value: 'imagen-4-pro', label: 'Imagen 4 Pro', description: 'Alta qualidade' },
  { value: 'imagen-3', label: 'Imagen 3', description: 'Modelo padrão' },
];

export const GAMMA_IMAGE_STYLES = [
  { value: 'photorealistic', label: 'Fotorrealista', description: 'Estilo foto' },
  { value: 'minimal', label: 'Minimalista', description: 'Limpo e simples' },
  { value: 'abstract', label: 'Abstrato', description: 'Formas e cores' },
  { value: 'cinematic', label: 'Cinematográfico', description: 'Estilo filme' },
  { value: 'illustration', label: 'Ilustração', description: 'Desenho artístico' },
  { value: 'corporate', label: 'Corporativo', description: 'Profissional e sério' },
];

export const GAMMA_CARD_DIMENSIONS = [
  { value: 'fluid', label: 'Fluido', description: 'Adapta ao conteúdo' },
  { value: '16x9', label: '16:9', description: 'Slides padrão' },
  { value: '4x3', label: '4:3', description: 'Formato clássico' },
  { value: 'pageless', label: 'Sem Página', description: 'Scroll contínuo' },
  { value: 'letter', label: 'Carta', description: 'Tamanho carta' },
  { value: 'a4', label: 'A4', description: 'Tamanho A4' },
];

export const GAMMA_LANGUAGES = [
  { value: 'pt-br', label: 'Português (Brasil)' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
];

export function useGammaSettings() {
  const [settings, setSettings] = useState<GammaSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Use type assertion since gamma_settings is a new table
      const { data, error } = await (supabase
        .from('gamma_settings' as any)
        .select('*')
        .single()) as { data: GammaSettings | null; error: any };

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching gamma settings:', error);
        toast.error('Erro ao carregar configurações do Gamma');
        return;
      }

      if (data) {
        setSettings(data);
      }
    } catch (err) {
      console.error('Error in fetchSettings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: GammaSettingsUpdate): Promise<boolean> => {
    if (!settings?.id) return false;
    
    setSaving(true);
    try {
      const { error } = await (supabase
        .from('gamma_settings' as any)
        .update(updates)
        .eq('id', settings.id)) as { error: any };

      if (error) {
        console.error('Error updating gamma settings:', error);
        toast.error('Erro ao salvar configurações');
        return false;
      }

      setSettings(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Configurações do Gamma salvas!');
      return true;
    } catch (err) {
      console.error('Error in updateSettings:', err);
      toast.error('Erro ao salvar configurações');
      return false;
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
