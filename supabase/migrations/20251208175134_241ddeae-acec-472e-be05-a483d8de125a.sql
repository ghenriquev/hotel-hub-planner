-- Create table for storing hotel reviews from external platforms
CREATE TABLE public.hotel_reviews_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- 'google', 'tripadvisor', 'booking'
  source_url TEXT,
  status TEXT DEFAULT 'pending', -- pending, crawling, completed, error
  reviews_count INTEGER DEFAULT 0,
  reviews_data JSONB, -- array with all raw reviews
  crawled_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.hotel_reviews_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view reviews data"
ON public.hotel_reviews_data
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert reviews data"
ON public.hotel_reviews_data
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update reviews data"
ON public.hotel_reviews_data
FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete reviews data"
ON public.hotel_reviews_data
FOR DELETE
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_hotel_reviews_data_updated_at
BEFORE UPDATE ON public.hotel_reviews_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create unique constraint for hotel + source combination
CREATE UNIQUE INDEX hotel_reviews_data_hotel_source_idx ON public.hotel_reviews_data(hotel_id, source);