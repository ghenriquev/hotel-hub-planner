-- Add columns to hotel_competitor_data for LLM-generated analysis
ALTER TABLE hotel_competitor_data 
  ADD COLUMN IF NOT EXISTS generated_analysis TEXT,
  ADD COLUMN IF NOT EXISTS analysis_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS llm_model_used TEXT;