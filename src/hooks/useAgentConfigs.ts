import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AgentConfig {
  id: string;
  module_id: number;
  module_title: string;
  prompt: string;
  output_type: string;
  llm_model: string;
  materials_config: string[];
  secondary_materials_config: number[];
  created_at: string;
  updated_at: string;
}

export function useAgentConfigs() {
  const [configs, setConfigs] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConfigs = useCallback(async () => {
    const { data, error } = await supabase
      .from('agent_configs')
      .select('*')
      .order('module_id');

    if (error) {
      console.error('Error fetching agent configs:', error);
      toast.error('Erro ao carregar configurações dos agentes');
      return;
    }

    setConfigs((data || []) as AgentConfig[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const updateConfig = useCallback(async (moduleId: number, updates: Partial<Pick<AgentConfig, 'prompt' | 'output_type' | 'llm_model' | 'materials_config' | 'secondary_materials_config'>>) => {
    const { error } = await supabase
      .from('agent_configs')
      .update(updates)
      .eq('module_id', moduleId);

    if (error) {
      console.error('Error updating agent config:', error);
      toast.error('Erro ao salvar configuração');
      return false;
    }

    toast.success('Configuração salva!');
    fetchConfigs();
    return true;
  }, [fetchConfigs]);

  const getConfigForModule = useCallback((moduleId: number): AgentConfig | undefined => {
    return configs.find(c => c.module_id === moduleId);
  }, [configs]);

  return { configs, loading, updateConfig, getConfigForModule, refetch: fetchConfigs };
}
