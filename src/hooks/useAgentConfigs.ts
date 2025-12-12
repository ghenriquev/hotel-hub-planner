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
  display_order: number;
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
      .order('display_order');

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

  const createConfig = useCallback(async (config: { module_title: string; prompt: string; output_type: string; llm_model: string }) => {
    // Get next module_id
    const maxModuleId = configs.length > 0 ? Math.max(...configs.map(c => c.module_id)) : -1;
    const nextModuleId = maxModuleId + 1;
    
    // Get next display_order
    const maxDisplayOrder = configs.length > 0 ? Math.max(...configs.map(c => c.display_order)) : -1;
    const nextDisplayOrder = maxDisplayOrder + 1;

    const { error } = await supabase
      .from('agent_configs')
      .insert({
        module_id: nextModuleId,
        module_title: config.module_title,
        prompt: config.prompt,
        output_type: config.output_type,
        llm_model: config.llm_model,
        materials_config: ['manual', 'dados', 'transcricao'],
        secondary_materials_config: [],
        display_order: nextDisplayOrder,
      });

    if (error) {
      console.error('Error creating agent config:', error);
      toast.error('Erro ao criar agente');
      return false;
    }

    toast.success('Agente criado!');
    fetchConfigs();
    return true;
  }, [configs, fetchConfigs]);

  const deleteConfig = useCallback(async (moduleId: number) => {
    const { error } = await supabase
      .from('agent_configs')
      .delete()
      .eq('module_id', moduleId);

    if (error) {
      console.error('Error deleting agent config:', error);
      toast.error('Erro ao excluir agente');
      return false;
    }

    toast.success('Agente excluído!');
    fetchConfigs();
    return true;
  }, [fetchConfigs]);

  const reorderConfigs = useCallback(async (orderedModuleIds: number[]) => {
    // Update display_order for each config
    const updates = orderedModuleIds.map((moduleId, index) => 
      supabase
        .from('agent_configs')
        .update({ display_order: index })
        .eq('module_id', moduleId)
    );

    const results = await Promise.all(updates);
    const hasError = results.some(r => r.error);

    if (hasError) {
      console.error('Error reordering agent configs');
      toast.error('Erro ao reordenar agentes');
      return false;
    }

    fetchConfigs();
    return true;
  }, [fetchConfigs]);

  const getConfigForModule = useCallback((moduleId: number): AgentConfig | undefined => {
    return configs.find(c => c.module_id === moduleId);
  }, [configs]);

  return { 
    configs, 
    loading, 
    updateConfig, 
    createConfig,
    deleteConfig,
    reorderConfigs,
    getConfigForModule, 
    refetch: fetchConfigs 
  };
}
