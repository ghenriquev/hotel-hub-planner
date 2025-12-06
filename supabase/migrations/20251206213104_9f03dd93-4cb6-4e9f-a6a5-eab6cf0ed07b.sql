-- Create table to store crawled website data
CREATE TABLE public.hotel_website_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id TEXT NOT NULL UNIQUE,
  website_url TEXT NOT NULL,
  crawled_content JSONB,
  crawled_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.hotel_website_data ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view website data"
  ON public.hotel_website_data FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert website data"
  ON public.hotel_website_data FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update website data"
  ON public.hotel_website_data FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete website data"
  ON public.hotel_website_data FOR DELETE TO authenticated USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_hotel_website_data_updated_at
  BEFORE UPDATE ON public.hotel_website_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();