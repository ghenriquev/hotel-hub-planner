-- Add display_order column for visual ordering of agents
ALTER TABLE public.agent_configs 
ADD COLUMN display_order INTEGER;

-- Initialize display_order with current module_id values
UPDATE public.agent_configs 
SET display_order = module_id;

-- Make display_order NOT NULL after initialization
ALTER TABLE public.agent_configs 
ALTER COLUMN display_order SET NOT NULL;

-- Add default for new agents
ALTER TABLE public.agent_configs 
ALTER COLUMN display_order SET DEFAULT 999;