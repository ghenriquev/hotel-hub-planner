-- Create gamma_settings table for global Gamma API configuration
CREATE TABLE public.gamma_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Layout settings
  theme_id TEXT DEFAULT 'Oasis',
  num_cards INTEGER DEFAULT 10,
  card_split TEXT DEFAULT 'auto',
  text_mode TEXT DEFAULT 'generate',
  format TEXT DEFAULT 'presentation',
  additional_instructions TEXT DEFAULT '',
  
  -- Text options
  text_amount TEXT DEFAULT 'detailed',
  text_tone TEXT DEFAULT 'professional',
  text_audience TEXT DEFAULT 'hotel management professionals',
  text_language TEXT DEFAULT 'pt-br',
  
  -- Image options
  image_source TEXT DEFAULT 'aiGenerated',
  image_model TEXT DEFAULT 'imagen-4-pro',
  image_style TEXT DEFAULT 'photorealistic',
  
  -- Card options
  card_dimensions TEXT DEFAULT 'fluid',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gamma_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage gamma settings
CREATE POLICY "Admins can manage gamma settings"
ON public.gamma_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone authenticated can read gamma settings (needed for edge function)
CREATE POLICY "Authenticated users can read gamma settings"
ON public.gamma_settings
FOR SELECT
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_gamma_settings_updated_at
BEFORE UPDATE ON public.gamma_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings row
INSERT INTO public.gamma_settings (id) VALUES (gen_random_uuid());