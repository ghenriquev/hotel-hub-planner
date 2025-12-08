-- Add social profile columns to hotels table
ALTER TABLE public.hotels
ADD COLUMN instagram_url text,
ADD COLUMN tripadvisor_url text,
ADD COLUMN booking_url text,
ADD COLUMN google_business_url text;