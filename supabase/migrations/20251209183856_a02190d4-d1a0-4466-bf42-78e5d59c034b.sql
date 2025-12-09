-- Create table for storing competitor website data
CREATE TABLE public.hotel_competitor_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  competitor_url TEXT NOT NULL,
  competitor_number INTEGER NOT NULL CHECK (competitor_number BETWEEN 1 AND 3),
  crawled_content JSONB,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  crawled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hotel_id, competitor_number)
);

-- Enable RLS
ALTER TABLE public.hotel_competitor_data ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view competitor data"
ON public.hotel_competitor_data FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert competitor data"
ON public.hotel_competitor_data FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update competitor data"
ON public.hotel_competitor_data FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete competitor data"
ON public.hotel_competitor_data FOR DELETE
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_hotel_competitor_data_updated_at
BEFORE UPDATE ON public.hotel_competitor_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();