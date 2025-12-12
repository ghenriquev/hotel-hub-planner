-- Deletar configurações dos agentes 9 e 10 (Recomendações de Ferramentas e Cliente Oculto)
DELETE FROM agent_configs WHERE module_id IN (9, 10);

-- Deletar resultados existentes desses agentes
DELETE FROM agent_results WHERE module_id IN (9, 10);