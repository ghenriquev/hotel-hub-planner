
CREATE TABLE public.hotel_project_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  
  -- Meeting links
  meeting_kickoff_url TEXT,
  meeting_phase1_url TEXT,
  meeting_phase2_url TEXT,
  meeting_final_url TEXT,
  
  -- Phase 1 - Kick Off presentation link
  phase1_presentation_url TEXT DEFAULT 'https://gamma.app/docs/KICK-OFF-Plano-Estrategico-de-Vendas-Diretas-5ul4lfxo39kby07?mode=doc',
  
  -- Phase 2 - Strategic summary (AI generated)
  phase2_summary TEXT,
  phase2_presentation_url TEXT,
  phase2_status TEXT DEFAULT 'pending',
  phase2_generated_at TIMESTAMPTZ,
  
  -- Phase 3/4 - Deliverables (JSON structure)
  phase34_deliverables JSONB DEFAULT '{}'::jsonb,
  
  -- Phase 5 - Final report (AI generated)
  phase5_report TEXT,
  phase5_presentation_url TEXT,
  phase5_status TEXT DEFAULT 'pending',
  phase5_generated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(hotel_id)
);

-- Enable RLS
ALTER TABLE public.hotel_project_data ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view project data of their own hotels or as admin
CREATE POLICY "Users can view project data of own hotels"
ON public.hotel_project_data FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM hotels WHERE hotels.id = hotel_project_data.hotel_id
  AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

-- Public can view (for public client view)
CREATE POLICY "Public can view project data"
ON public.hotel_project_data FOR SELECT TO anon
USING (true);

-- Users can insert
CREATE POLICY "Users can insert project data to own hotels"
ON public.hotel_project_data FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM hotels WHERE hotels.id = hotel_project_data.hotel_id
  AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

-- Users can update
CREATE POLICY "Users can update project data of own hotels"
ON public.hotel_project_data FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM hotels WHERE hotels.id = hotel_project_data.hotel_id
  AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

-- Users can delete
CREATE POLICY "Users can delete project data of own hotels"
ON public.hotel_project_data FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM hotels WHERE hotels.id = hotel_project_data.hotel_id
  AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

-- Trigger for updated_at
CREATE TRIGGER update_hotel_project_data_updated_at
BEFORE UPDATE ON public.hotel_project_data
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
