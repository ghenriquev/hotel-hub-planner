import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHotelMaterials } from './useHotelMaterials';
import { useHotelWebsiteData } from './useHotelWebsiteData';
import { useHotelReviews } from './useHotelReviews';
import { useHotelCompetitorData } from './useHotelCompetitorData';
import { useAgentResults } from './useAgentResults';
import { useAgentConfigs, AgentConfig } from './useAgentConfigs';

interface MaterialStatus {
  id: string;
  label: string;
  ready: boolean;
  type: 'primary' | 'research' | 'secondary';
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
};

const RESEARCH_MATERIALS_LABELS: Record<string, string> = {
  website: 'Conteúdo do Site',
  reviews: 'Avaliações Consolidadas',
  competitors: 'Conteúdo dos Concorrentes',
};

export function useAgentReadiness(hotelId: string, moduleId: number): AgentReadiness {
  const { getMaterial, loading: materialsLoading } = useHotelMaterials(hotelId);
  const { websiteData, loading: websiteLoading } = useHotelWebsiteData(hotelId);
  const { hasAnyCompleted: hasReviewsCompleted, loading: reviewsLoading } = useHotelReviews(hotelId);
  const { hasAnyCompleted: hasCompetitorsCompleted, loading: competitorsLoading } = useHotelCompetitorData(hotelId);
  const { results: agentResults, loading: resultsLoading } = useAgentResults(hotelId);
  const { configs, loading: configsLoading } = useAgentConfigs();

  const isLoading = materialsLoading || websiteLoading || reviewsLoading || competitorsLoading || resultsLoading || configsLoading;

  const materials = useMemo(() => {
    const config = configs.find(c => c.module_id === moduleId);
    if (!config) return [];

    const materialsList: MaterialStatus[] = [];

    // Check all materials from materials_config
    const allMaterials = config.materials_config || [];
    allMaterials.forEach(materialId => {
      let ready = false;
      let type: 'primary' | 'research' = 'primary';
      let label = '';
      
      switch (materialId) {
        case 'manual':
          ready = !!getMaterial('manual');
          label = PRIMARY_MATERIALS_LABELS[materialId];
          type = 'primary';
          break;
        case 'dados':
          ready = !!getMaterial('dados');
          label = PRIMARY_MATERIALS_LABELS[materialId];
          type = 'primary';
          break;
        case 'transcricao':
          ready = !!getMaterial('transcricao');
          label = PRIMARY_MATERIALS_LABELS[materialId];
          type = 'primary';
          break;
        case 'website':
          ready = websiteData?.status === 'completed';
          label = RESEARCH_MATERIALS_LABELS[materialId];
          type = 'research';
          break;
        case 'reviews':
          ready = hasReviewsCompleted();
          label = RESEARCH_MATERIALS_LABELS[materialId];
          type = 'research';
          break;
        case 'competitors':
          ready = hasCompetitorsCompleted();
          label = RESEARCH_MATERIALS_LABELS[materialId];
          type = 'research';
          break;
        default:
          label = materialId;
      }

      materialsList.push({
        id: materialId,
        label,
        ready,
        type,
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
  }, [configs, moduleId, getMaterial, websiteData, hasReviewsCompleted, hasCompetitorsCompleted, agentResults]);

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
