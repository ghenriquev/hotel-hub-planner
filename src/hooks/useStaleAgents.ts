import { useMemo } from 'react';
import { AgentResult } from './useAgentResults';
import { AgentConfig } from './useAgentConfigs';

/**
 * Determines which agents have stale results because their
 * secondary materials (other agent results) were regenerated after them.
 */
export function useStaleAgents(
  results: AgentResult[],
  configs: AgentConfig[]
) {
  return useMemo(() => {
    const staleMap: Record<number, { stale: boolean; updatedDeps: string[] }> = {};

    for (const config of configs) {
      const secondaryIds = config.secondary_materials_config || [];
      if (secondaryIds.length === 0) {
        staleMap[config.module_id] = { stale: false, updatedDeps: [] };
        continue;
      }

      const myResult = results.find(r => r.module_id === config.module_id);
      if (!myResult || myResult.status !== 'completed' || !myResult.generated_at) {
        staleMap[config.module_id] = { stale: false, updatedDeps: [] };
        continue;
      }

      const myTime = new Date(myResult.generated_at).getTime();
      const updatedDeps: string[] = [];

      for (const depId of secondaryIds) {
        const depResult = results.find(r => r.module_id === depId);
        if (depResult?.generated_at) {
          const depTime = new Date(depResult.generated_at).getTime();
          if (depTime > myTime) {
            const depConfig = configs.find(c => c.module_id === depId);
            updatedDeps.push(depConfig?.module_title || `Agente ${depId}`);
          }
        }
      }

      staleMap[config.module_id] = {
        stale: updatedDeps.length > 0,
        updatedDeps,
      };
    }

    return staleMap;
  }, [results, configs]);
}
