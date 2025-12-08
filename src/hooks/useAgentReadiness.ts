import { useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { useHotelWebsiteData } from './useHotelWebsiteData';
import { useAgentResults } from './useAgentResults';
import { useAgentConfigs, AgentConfig } from './useAgentConfigs';

interface MaterialStatus {
  id: string;
  label: string;
  ready: boolean;
  type: 'primary' | 'secondary';
}

interface AgentReadiness {
  isReady: boolean;
  isLoading: boolean;
  materials: MaterialStatus[];
  missingMaterials: MaterialStatus[];
  readyMaterials: MaterialStatus[];
}

const PRIMARY_MATERIALS_LABELS: Record<string, string> = {
  manual: 'Manual de Funcionamento',
  dados: 'Briefing de Criação',
  transcricao: 'Transcrição de Kickoff',
  website: 'Conteúdo do Site',
};

export function useAgentReadiness(hotelId: string, moduleId: number): AgentReadiness {
  const { getHotel } = useStore();
  const hotel = getHotel(hotelId);
  const { websiteData, loading: websiteLoading } = useHotelWebsiteData(hotelId);
  const { results: agentResults, loading: resultsLoading } = useAgentResults(hotelId);
  const { configs, loading: configsLoading } = useAgentConfigs();

  const isLoading = websiteLoading || resultsLoading || configsLoading;

  const materials = useMemo(() => {
    const config = configs.find(c => c.module_id === moduleId);
    if (!config || !hotel) return [];

    const materialsList: MaterialStatus[] = [];

    // Check primary materials
    const primaryMaterials = config.materials_config || [];
    primaryMaterials.forEach(materialId => {
      let ready = false;
      
      switch (materialId) {
        case 'manual':
          ready = !!hotel.strategicMaterials?.manualFuncionamentoUrl;
          break;
        case 'dados':
          ready = !!hotel.strategicMaterials?.dadosHotelUrl;
          break;
        case 'transcricao':
          ready = !!hotel.strategicMaterials?.transcricaoKickoffUrl;
          break;
        case 'website':
          ready = websiteData?.status === 'completed';
          break;
      }

      materialsList.push({
        id: materialId,
        label: PRIMARY_MATERIALS_LABELS[materialId] || materialId,
        ready,
        type: 'primary',
      });
    });

    // Check secondary materials (results from other agents)
    const secondaryModules = config.secondary_materials_config || [];
    secondaryModules.forEach(secondaryModuleId => {
      const secondaryConfig = configs.find(c => c.module_id === secondaryModuleId);
      const secondaryResult = agentResults.find(
        r => r.module_id === secondaryModuleId && r.status === 'completed'
      );

      materialsList.push({
        id: `agent_${secondaryModuleId}`,
        label: `Agente ${secondaryModuleId}: ${secondaryConfig?.module_title || 'Módulo ' + secondaryModuleId}`,
        ready: !!secondaryResult,
        type: 'secondary',
      });
    });

    return materialsList;
  }, [configs, moduleId, hotel, websiteData, agentResults]);

  const missingMaterials = useMemo(() => 
    materials.filter(m => !m.ready), 
    [materials]
  );

  const readyMaterials = useMemo(() => 
    materials.filter(m => m.ready), 
    [materials]
  );

  const isReady = materials.length > 0 && missingMaterials.length === 0;

  return {
    isReady,
    isLoading,
    materials,
    missingMaterials,
    readyMaterials,
  };
}
