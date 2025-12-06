-- Add llm_model column to agent_configs table
ALTER TABLE public.agent_configs
ADD COLUMN llm_model text NOT NULL DEFAULT 'lovable/gemini-2.5-flash';