-- Drop existing overly permissive policies on hotels table
DROP POLICY IF EXISTS "Authenticated users can view all hotels" ON public.hotels;
DROP POLICY IF EXISTS "Authenticated users can insert hotels" ON public.hotels;
DROP POLICY IF EXISTS "Authenticated users can update hotels" ON public.hotels;
DROP POLICY IF EXISTS "Authenticated users can delete hotels" ON public.hotels;

-- Create ownership-based policies for hotels
CREATE POLICY "Users can view own hotels or admins can view all"
ON public.hotels FOR SELECT TO authenticated
USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create hotels with own user_id"
ON public.hotels FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own hotels or admins can update all"
ON public.hotels FOR UPDATE TO authenticated
USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete own hotels or admins can delete all"
ON public.hotels FOR DELETE TO authenticated
USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

-- Drop existing overly permissive policies on hotel_materials
DROP POLICY IF EXISTS "Authenticated users can view all materials" ON public.hotel_materials;
DROP POLICY IF EXISTS "Authenticated users can insert materials" ON public.hotel_materials;
DROP POLICY IF EXISTS "Authenticated users can update materials" ON public.hotel_materials;
DROP POLICY IF EXISTS "Authenticated users can delete materials" ON public.hotel_materials;

-- Create ownership-based policies for hotel_materials (based on parent hotel ownership)
CREATE POLICY "Users can view materials of own hotels"
ON public.hotel_materials FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM hotels WHERE hotels.id = hotel_materials.hotel_id AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

CREATE POLICY "Users can insert materials to own hotels"
ON public.hotel_materials FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM hotels WHERE hotels.id = hotel_materials.hotel_id AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

CREATE POLICY "Users can update materials of own hotels"
ON public.hotel_materials FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM hotels WHERE hotels.id = hotel_materials.hotel_id AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

CREATE POLICY "Users can delete materials of own hotels"
ON public.hotel_materials FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM hotels WHERE hotels.id = hotel_materials.hotel_id AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

-- Drop existing overly permissive policies on hotel_website_data
DROP POLICY IF EXISTS "Authenticated users can view website data" ON public.hotel_website_data;
DROP POLICY IF EXISTS "Authenticated users can insert website data" ON public.hotel_website_data;
DROP POLICY IF EXISTS "Authenticated users can update website data" ON public.hotel_website_data;
DROP POLICY IF EXISTS "Authenticated users can delete website data" ON public.hotel_website_data;

-- Create ownership-based policies for hotel_website_data (hotel_id is text type)
CREATE POLICY "Users can view website data of own hotels"
ON public.hotel_website_data FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM hotels WHERE hotels.id::text = hotel_website_data.hotel_id AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

CREATE POLICY "Users can insert website data to own hotels"
ON public.hotel_website_data FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM hotels WHERE hotels.id::text = hotel_website_data.hotel_id AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

CREATE POLICY "Users can update website data of own hotels"
ON public.hotel_website_data FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM hotels WHERE hotels.id::text = hotel_website_data.hotel_id AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

CREATE POLICY "Users can delete website data of own hotels"
ON public.hotel_website_data FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM hotels WHERE hotels.id::text = hotel_website_data.hotel_id AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

-- Drop existing overly permissive policies on hotel_reviews_data
DROP POLICY IF EXISTS "Authenticated users can view reviews data" ON public.hotel_reviews_data;
DROP POLICY IF EXISTS "Authenticated users can insert reviews data" ON public.hotel_reviews_data;
DROP POLICY IF EXISTS "Authenticated users can update reviews data" ON public.hotel_reviews_data;
DROP POLICY IF EXISTS "Authenticated users can delete reviews data" ON public.hotel_reviews_data;

-- Create ownership-based policies for hotel_reviews_data
CREATE POLICY "Users can view reviews data of own hotels"
ON public.hotel_reviews_data FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM hotels WHERE hotels.id = hotel_reviews_data.hotel_id AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

CREATE POLICY "Users can insert reviews data to own hotels"
ON public.hotel_reviews_data FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM hotels WHERE hotels.id = hotel_reviews_data.hotel_id AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

CREATE POLICY "Users can update reviews data of own hotels"
ON public.hotel_reviews_data FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM hotels WHERE hotels.id = hotel_reviews_data.hotel_id AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

CREATE POLICY "Users can delete reviews data of own hotels"
ON public.hotel_reviews_data FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM hotels WHERE hotels.id = hotel_reviews_data.hotel_id AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

-- Drop existing overly permissive policies on hotel_milestones
DROP POLICY IF EXISTS "Authenticated users can view all milestones" ON public.hotel_milestones;
DROP POLICY IF EXISTS "Authenticated users can insert milestones" ON public.hotel_milestones;
DROP POLICY IF EXISTS "Authenticated users can update milestones" ON public.hotel_milestones;
DROP POLICY IF EXISTS "Authenticated users can delete milestones" ON public.hotel_milestones;

-- Create ownership-based policies for hotel_milestones
CREATE POLICY "Users can view milestones of own hotels"
ON public.hotel_milestones FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM hotels WHERE hotels.id = hotel_milestones.hotel_id AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

CREATE POLICY "Users can insert milestones to own hotels"
ON public.hotel_milestones FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM hotels WHERE hotels.id = hotel_milestones.hotel_id AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

CREATE POLICY "Users can update milestones of own hotels"
ON public.hotel_milestones FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM hotels WHERE hotels.id = hotel_milestones.hotel_id AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

CREATE POLICY "Users can delete milestones of own hotels"
ON public.hotel_milestones FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM hotels WHERE hotels.id = hotel_milestones.hotel_id AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

-- Drop existing overly permissive policies on hotel_competitor_data
DROP POLICY IF EXISTS "Authenticated users can view competitor data" ON public.hotel_competitor_data;
DROP POLICY IF EXISTS "Authenticated users can insert competitor data" ON public.hotel_competitor_data;
DROP POLICY IF EXISTS "Authenticated users can update competitor data" ON public.hotel_competitor_data;
DROP POLICY IF EXISTS "Authenticated users can delete competitor data" ON public.hotel_competitor_data;

-- Create ownership-based policies for hotel_competitor_data
CREATE POLICY "Users can view competitor data of own hotels"
ON public.hotel_competitor_data FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM hotels WHERE hotels.id = hotel_competitor_data.hotel_id AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

CREATE POLICY "Users can insert competitor data to own hotels"
ON public.hotel_competitor_data FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM hotels WHERE hotels.id = hotel_competitor_data.hotel_id AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

CREATE POLICY "Users can update competitor data of own hotels"
ON public.hotel_competitor_data FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM hotels WHERE hotels.id = hotel_competitor_data.hotel_id AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

CREATE POLICY "Users can delete competitor data of own hotels"
ON public.hotel_competitor_data FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM hotels WHERE hotels.id = hotel_competitor_data.hotel_id AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

-- Drop existing overly permissive policies on agent_results
DROP POLICY IF EXISTS "Authenticated users can read agent results" ON public.agent_results;
DROP POLICY IF EXISTS "Authenticated users can manage agent results" ON public.agent_results;

-- Create ownership-based policies for agent_results (hotel_id is text type)
CREATE POLICY "Users can view agent results of own hotels"
ON public.agent_results FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM hotels WHERE hotels.id::text = agent_results.hotel_id AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

CREATE POLICY "Users can insert agent results to own hotels"
ON public.agent_results FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM hotels WHERE hotels.id::text = agent_results.hotel_id AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

CREATE POLICY "Users can update agent results of own hotels"
ON public.agent_results FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM hotels WHERE hotels.id::text = agent_results.hotel_id AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

CREATE POLICY "Users can delete agent results of own hotels"
ON public.agent_results FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM hotels WHERE hotels.id::text = agent_results.hotel_id AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));