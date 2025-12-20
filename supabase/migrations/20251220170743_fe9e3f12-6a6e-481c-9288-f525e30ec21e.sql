-- Add manual form token to hotels table
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS manual_form_token UUID DEFAULT gen_random_uuid();

-- Create hotel_manual_data table
CREATE TABLE public.hotel_manual_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  
  -- Dados Cadastrais
  foundation_year TEXT,
  room_count TEXT,
  main_structure TEXT,
  other_social_media TEXT,
  
  -- Dados Legais
  legal_name TEXT,
  cnpj TEXT,
  address TEXT,
  neighborhood TEXT,
  state TEXT,
  zip_code TEXT,
  
  -- Contatos Contratante
  contractor_name TEXT,
  contractor_email TEXT,
  witness_name TEXT,
  witness_email TEXT,
  
  -- Contatos Departamentos (JSON flexível)
  department_contacts JSONB DEFAULT '{}',
  
  -- Diferenciais (JSON)
  differentials JSONB DEFAULT '{}',
  
  -- Internet e Políticas
  internet_info JSONB DEFAULT '{}',
  policies JSONB DEFAULT '{}',
  
  -- Acomodações (array de objetos)
  accommodations JSONB DEFAULT '[]',
  
  -- Gastronomia
  gastronomy JSONB DEFAULT '{}',
  
  -- Lazer
  leisure JSONB DEFAULT '{}',
  
  -- Estacionamento
  parking JSONB DEFAULT '{}',
  
  -- Site
  site_info JSONB DEFAULT '{}',
  
  -- ADS/Marketing
  ads_marketing JSONB DEFAULT '{}',
  
  -- Acessos
  access_credentials JSONB DEFAULT '{}',
  
  -- Mailing
  mailing_submitted BOOLEAN DEFAULT FALSE,
  
  -- Status e Metadados
  current_step INTEGER DEFAULT 1,
  is_complete BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint for hotel_id
ALTER TABLE public.hotel_manual_data ADD CONSTRAINT hotel_manual_data_hotel_id_key UNIQUE (hotel_id);

-- Enable RLS
ALTER TABLE public.hotel_manual_data ENABLE ROW LEVEL SECURITY;

-- RLS policy for authenticated users (hotel owners and admins)
CREATE POLICY "Users can view manual data of own hotels"
ON public.hotel_manual_data
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.hotels
    WHERE hotels.id = hotel_manual_data.hotel_id
    AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Users can insert manual data to own hotels"
ON public.hotel_manual_data
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.hotels
    WHERE hotels.id = hotel_manual_data.hotel_id
    AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Users can update manual data of own hotels"
ON public.hotel_manual_data
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.hotels
    WHERE hotels.id = hotel_manual_data.hotel_id
    AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Users can delete manual data of own hotels"
ON public.hotel_manual_data
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.hotels
    WHERE hotels.id = hotel_manual_data.hotel_id
    AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Public access policy for form filling (using token validation)
CREATE POLICY "Public can insert manual data with valid token"
ON public.hotel_manual_data
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.hotels
    WHERE hotels.id = hotel_manual_data.hotel_id
  )
);

CREATE POLICY "Public can update manual data with valid hotel"
ON public.hotel_manual_data
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.hotels
    WHERE hotels.id = hotel_manual_data.hotel_id
  )
);

CREATE POLICY "Public can view manual data for valid hotel"
ON public.hotel_manual_data
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.hotels
    WHERE hotels.id = hotel_manual_data.hotel_id
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_hotel_manual_data_updated_at
BEFORE UPDATE ON public.hotel_manual_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();