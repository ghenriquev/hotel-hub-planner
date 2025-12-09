-- Create research_settings table for configurable research parameters
CREATE TABLE public.research_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Competitor crawler settings
  competitor_max_pages INTEGER DEFAULT 8,
  competitor_max_depth INTEGER DEFAULT 2,
  competitor_crawler_type TEXT DEFAULT 'playwright:firefox',
  
  -- Hotel website crawler settings
  website_max_pages INTEGER DEFAULT 10,
  website_max_depth INTEGER DEFAULT 2,
  website_crawler_type TEXT DEFAULT 'playwright:firefox',
  
  -- Reviews settings
  reviews_max_months INTEGER DEFAULT 24,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.research_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage research settings" 
ON public.research_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can read research settings" 
ON public.research_settings 
FOR SELECT 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_research_settings_updated_at
BEFORE UPDATE ON public.research_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings row
INSERT INTO public.research_settings (id) VALUES (gen_random_uuid());