-- Create api_keys table for storing external API keys
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key_type text NOT NULL,
  api_key text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Only admins can manage API keys
CREATE POLICY "Admins can manage API keys"
ON public.api_keys FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_api_keys_updated_at
BEFORE UPDATE ON public.api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();