-- Add presentation_status column to track background generation
ALTER TABLE agent_results 
ADD COLUMN IF NOT EXISTS presentation_status text 
CHECK (presentation_status IN ('generating', 'completed', 'error'));