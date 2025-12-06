-- Add presentation_url column to agent_results table
ALTER TABLE public.agent_results 
ADD COLUMN presentation_url TEXT;