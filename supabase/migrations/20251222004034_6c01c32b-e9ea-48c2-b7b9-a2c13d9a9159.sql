-- Migrate existing competitor data from hotels table to hotel_competitor_data
-- This will only insert where competitor URLs exist and no data exists yet

INSERT INTO public.hotel_competitor_data (hotel_id, competitor_url, competitor_number, status, analysis_status)
SELECT 
  h.id,
  h.competitor_site_1,
  1,
  'pending',
  'pending'
FROM public.hotels h
WHERE h.competitor_site_1 IS NOT NULL 
  AND h.competitor_site_1 != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.hotel_competitor_data cd 
    WHERE cd.hotel_id = h.id AND cd.competitor_number = 1
  );

INSERT INTO public.hotel_competitor_data (hotel_id, competitor_url, competitor_number, status, analysis_status)
SELECT 
  h.id,
  h.competitor_site_2,
  2,
  'pending',
  'pending'
FROM public.hotels h
WHERE h.competitor_site_2 IS NOT NULL 
  AND h.competitor_site_2 != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.hotel_competitor_data cd 
    WHERE cd.hotel_id = h.id AND cd.competitor_number = 2
  );

INSERT INTO public.hotel_competitor_data (hotel_id, competitor_url, competitor_number, status, analysis_status)
SELECT 
  h.id,
  h.competitor_site_3,
  3,
  'pending',
  'pending'
FROM public.hotels h
WHERE h.competitor_site_3 IS NOT NULL 
  AND h.competitor_site_3 != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.hotel_competitor_data cd 
    WHERE cd.hotel_id = h.id AND cd.competitor_number = 3
  );