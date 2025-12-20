-- Allow public access to hotels table for reading manual_form_token (needed for public form validation)
CREATE POLICY "Public can view hotel basic info for manual form"
ON public.hotels
FOR SELECT
USING (true);

-- Drop existing conflicting policies on hotel_manual_data if needed
DROP POLICY IF EXISTS "Public can insert manual data with valid token" ON public.hotel_manual_data;
DROP POLICY IF EXISTS "Public can update manual data with valid hotel" ON public.hotel_manual_data;
DROP POLICY IF EXISTS "Public can view manual data for valid hotel" ON public.hotel_manual_data;

-- Create proper public access policies for hotel_manual_data
CREATE POLICY "Anyone can view manual data"
ON public.hotel_manual_data
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert manual data"
ON public.hotel_manual_data
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update manual data"
ON public.hotel_manual_data
FOR UPDATE
USING (true);