-- Add competitor site columns to hotels table
ALTER TABLE public.hotels 
ADD COLUMN competitor_site_1 text,
ADD COLUMN competitor_site_2 text,
ADD COLUMN competitor_site_3 text;