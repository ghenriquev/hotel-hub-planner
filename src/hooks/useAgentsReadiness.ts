import { useMemo } from 'react';
import { useHotelMaterials } from './useHotelMaterials';
import { useHotelWebsiteData } from './useHotelWebsiteData';
import { useHotelReviews } from './useHotelReviews';
import { useAgentResults } from './useAgentResults';
import { useAgentConfigs } from './useAgentConfigs';
import { useHotelManualData } from './useHotelManualData';

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
  cliente_oculto: 'Cliente Oculto',
};

const RESEARCH_MATERIALS_LABELS: Record<string, string> = {
  website: 'Conteúdo do Site',
  reviews: 'Avaliações Consolidadas',
};

export function useAgentsReadiness(hotelId: string | undefined) {
  const { getMaterial, loading: materialsLoading } = useHotelMaterials(hotelId);
  const { websiteData, loading: websiteLoading } = useHotelWebsiteData(hotelId);
  const { hasAnyCompleted: hasReviewsCompleted, loading: reviewsLoading } = useHotelReviews(hotelId);
  const { results: agentResults, loading: resultsLoading } = useAgentResults(hotelId);
  const { configs, loading: configsLoading } = useAgentConfigs();
  const { manualData, loading: manualDataLoading } = useHotelManualData(hotelId);

  const isLoading = materialsLoading || websiteLoading || reviewsLoading || resultsLoading || configsLoading || manualDataLoading;

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
            // Manual pode estar em hotel_materials OU em hotel_manual_data
            ready = !!getMaterial('manual') || 
                    (manualData?.is_complete === true && 
                     (manualData?.input_method === 'upload' || manualData?.input_method === 'form'));
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
          case 'cliente_oculto':
            ready = !!getMaterial('cliente_oculto');
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
  }, [configs, getMaterial, websiteData, hasReviewsCompleted, agentResults, manualData]);

  const getReadiness = (moduleId: number): AgentReadinessInfo | undefined => {
    return agentsReadiness[moduleId];
  };

  return {
    agentsReadiness,
    getReadiness,
    isLoading,
  };
}
