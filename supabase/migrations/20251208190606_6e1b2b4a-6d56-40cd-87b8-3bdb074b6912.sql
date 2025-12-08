-- Update all agents to use Gemini 3 Pro as default model
UPDATE public.agent_configs 
SET llm_model = 'google/gemini-3-pro-preview';