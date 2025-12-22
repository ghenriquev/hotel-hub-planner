-- Remove a constraint que limita competitor_number a 1-3
ALTER TABLE public.hotel_competitor_data 
DROP CONSTRAINT IF EXISTS hotel_competitor_data_competitor_number_check;

-- Adiciona nova constraint que apenas garante valores positivos (sem limite superior)
ALTER TABLE public.hotel_competitor_data 
ADD CONSTRAINT hotel_competitor_data_competitor_number_check 
CHECK (competitor_number >= 1);