-- Drop the existing check constraint on material_type
ALTER TABLE public.hotel_materials DROP CONSTRAINT IF EXISTS hotel_materials_material_type_check;

-- Add a new check constraint that includes 'reviews' as a valid material type
ALTER TABLE public.hotel_materials ADD CONSTRAINT hotel_materials_material_type_check 
CHECK (material_type IN ('manual', 'dados', 'transcricao', 'reviews'));