
-- Create hotels table
CREATE TABLE public.hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  contact TEXT,
  category TEXT,
  website TEXT,
  has_no_website BOOLEAN DEFAULT FALSE,
  project_start_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

-- RLS policies for hotels
CREATE POLICY "Authenticated users can view all hotels"
ON public.hotels FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert hotels"
ON public.hotels FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update hotels"
ON public.hotels FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete hotels"
ON public.hotels FOR DELETE
TO authenticated
USING (true);

-- Create hotel_materials table
CREATE TABLE public.hotel_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE NOT NULL,
  material_type TEXT NOT NULL CHECK (material_type IN ('manual', 'dados', 'transcricao')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  text_content TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hotel_id, material_type)
);

-- Enable RLS
ALTER TABLE public.hotel_materials ENABLE ROW LEVEL SECURITY;

-- RLS policies for hotel_materials
CREATE POLICY "Authenticated users can view all materials"
ON public.hotel_materials FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert materials"
ON public.hotel_materials FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update materials"
ON public.hotel_materials FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete materials"
ON public.hotel_materials FOR DELETE
TO authenticated
USING (true);

-- Create hotel_milestones table
CREATE TABLE public.hotel_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE NOT NULL,
  milestone_key TEXT NOT NULL,
  name TEXT NOT NULL,
  start_week INTEGER NOT NULL,
  end_week INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hotel_id, milestone_key)
);

-- Enable RLS
ALTER TABLE public.hotel_milestones ENABLE ROW LEVEL SECURITY;

-- RLS policies for hotel_milestones
CREATE POLICY "Authenticated users can view all milestones"
ON public.hotel_milestones FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert milestones"
ON public.hotel_milestones FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update milestones"
ON public.hotel_milestones FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete milestones"
ON public.hotel_milestones FOR DELETE
TO authenticated
USING (true);

-- Add trigger for updated_at on hotels
CREATE TRIGGER update_hotels_updated_at
BEFORE UPDATE ON public.hotels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on hotel_materials
CREATE TRIGGER update_hotel_materials_updated_at
BEFORE UPDATE ON public.hotel_materials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
