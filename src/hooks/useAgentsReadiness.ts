import { useMemo } from 'react';
import { useHotelMaterials } from './useHotelMaterials';
import { useHotelWebsiteData } from './useHotelWebsiteData';
import { useAgentResults } from './useAgentResults';
import { useAgentConfigs } from './useAgentConfigs';

interface AgentReadinessInfo {
  moduleId: number;
  isReady: boolean;
  missingCount: number;
  missingLabels: string[];
}

const PRIMARY_MATERIALS_LABELS: Record<string, string> = {
  manual: 'Manual de Funcionamento',
  dados: 'Briefing de Criação',
  transcricao: 'Transcrição de Kickoff',
  website: 'Conteúdo do Site',
};

export function useAgentsReadiness(hotelId: string) {
  const { getMaterial, loading: materialsLoading } = useHotelMaterials(hotelId);
  const { websiteData, loading: websiteLoading } = useHotelWebsiteData(hotelId);
  const { results: agentResults, loading: resultsLoading } = useAgentResults(hotelId);
  const { configs, loading: configsLoading } = useAgentConfigs();

  const isLoading = materialsLoading || websiteLoading || resultsLoading || configsLoading;

  const agentsReadiness = useMemo(() => {
    const readinessMap: Record<number, AgentReadinessInfo> = {};

    configs.forEach(config => {
      const missingLabels: string[] = [];

      // Check primary materials
      const primaryMaterials = config.materials_config || [];
      primaryMaterials.forEach(materialId => {
        let ready = false;
        
        switch (materialId) {
          case 'manual':
            ready = !!getMaterial('manual');
            break;
          case 'dados':
            ready = !!getMaterial('dados');
            break;
          case 'transcricao':
            ready = !!getMaterial('transcricao');
            break;
          case 'website':
            ready = websiteData?.status === 'completed';
            break;
        }

        if (!ready) {
          missingLabels.push(PRIMARY_MATERIALS_LABELS[materialId] || materialId);
        }
      });

      // Check secondary materials (results from other agents)
      const secondaryModules = config.secondary_materials_config || [];
      secondaryModules.forEach(secondaryModuleId => {
        const secondaryConfig = configs.find(c => c.module_id === secondaryModuleId);
        const secondaryResult = agentResults.find(
          r => r.module_id === secondaryModuleId && r.status === 'completed'
        );

        if (!secondaryResult) {
          const label = secondaryConfig?.module_title || `Módulo ${secondaryModuleId}`;
          missingLabels.push(`Agente ${secondaryModuleId}: ${label}`);
        }
      });

      const totalMaterials = primaryMaterials.length + secondaryModules.length;
      const isReady = totalMaterials > 0 && missingLabels.length === 0;

      readinessMap[config.module_id] = {
        moduleId: config.module_id,
        isReady,
        missingCount: missingLabels.length,
        missingLabels,
      };
    });

    return readinessMap;
  }, [configs, getMaterial, websiteData, agentResults]);

  const getReadiness = (moduleId: number): AgentReadinessInfo | undefined => {
    return agentsReadiness[moduleId];
  };

  return {
    agentsReadiness,
    getReadiness,
    isLoading,
  };
}
