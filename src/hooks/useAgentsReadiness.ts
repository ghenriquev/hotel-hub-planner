import { useMemo } from 'react';
import { useHotelMaterials } from './useHotelMaterials';
import { useHotelWebsiteData } from './useHotelWebsiteData';
import { useHotelReviews } from './useHotelReviews';
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
};

const RESEARCH_MATERIALS_LABELS: Record<string, string> = {
  website: 'Conteúdo do Site',
  reviews: 'Avaliações Consolidadas',
};

export function useAgentsReadiness(hotelId: string) {
  const { getMaterial, loading: materialsLoading } = useHotelMaterials(hotelId);
  const { websiteData, loading: websiteLoading } = useHotelWebsiteData(hotelId);
  const { hasAnyCompleted: hasReviewsCompleted, loading: reviewsLoading } = useHotelReviews(hotelId);
  const { results: agentResults, loading: resultsLoading } = useAgentResults(hotelId);
  const { configs, loading: configsLoading } = useAgentConfigs();

  const isLoading = materialsLoading || websiteLoading || reviewsLoading || resultsLoading || configsLoading;

  const agentsReadiness = useMemo(() => {
    const readinessMap: Record<number, AgentReadinessInfo> = {};

    configs.forEach(config => {
      const missingLabels: string[] = [];

      // Check all materials from materials_config
      const allMaterials = config.materials_config || [];
      allMaterials.forEach(materialId => {
        let ready = false;
        let label = '';
        
        switch (materialId) {
          case 'manual':
            ready = !!getMaterial('manual');
            label = PRIMARY_MATERIALS_LABELS[materialId];
            break;
          case 'dados':
            ready = !!getMaterial('dados');
            label = PRIMARY_MATERIALS_LABELS[materialId];
            break;
          case 'transcricao':
            ready = !!getMaterial('transcricao');
            label = PRIMARY_MATERIALS_LABELS[materialId];
            break;
          case 'website':
            ready = websiteData?.status === 'completed';
            label = RESEARCH_MATERIALS_LABELS[materialId];
            break;
          case 'reviews':
            ready = hasReviewsCompleted();
            label = RESEARCH_MATERIALS_LABELS[materialId];
            break;
          default:
            label = materialId;
        }

        if (!ready) {
          missingLabels.push(label);
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

      const totalMaterials = allMaterials.length + secondaryModules.length;
      const isReady = totalMaterials > 0 && missingLabels.length === 0;

      readinessMap[config.module_id] = {
        moduleId: config.module_id,
        isReady,
        missingCount: missingLabels.length,
        missingLabels,
      };
    });

    return readinessMap;
  }, [configs, getMaterial, websiteData, hasReviewsCompleted, agentResults]);

  const getReadiness = (moduleId: number): AgentReadinessInfo | undefined => {
    return agentsReadiness[moduleId];
  };

  return {
    agentsReadiness,
    getReadiness,
    isLoading,
  };
}
