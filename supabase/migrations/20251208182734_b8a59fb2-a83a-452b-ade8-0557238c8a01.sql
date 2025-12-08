-- Add progress tracking columns to hotel_reviews_data
ALTER TABLE hotel_reviews_data 
ADD COLUMN IF NOT EXISTS crawl_progress integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS items_collected integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS progress_message text;