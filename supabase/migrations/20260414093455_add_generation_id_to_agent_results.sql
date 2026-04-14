ALTER TABLE public.agent_results ADD COLUMN IF NOT EXISTS generation_id TEXT DEFAULT NULL;
