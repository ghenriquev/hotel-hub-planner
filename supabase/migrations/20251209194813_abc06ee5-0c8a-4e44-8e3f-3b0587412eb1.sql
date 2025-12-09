-- Add manus_task_id column to hotel_competitor_data table
ALTER TABLE public.hotel_competitor_data 
ADD COLUMN IF NOT EXISTS manus_task_id TEXT;