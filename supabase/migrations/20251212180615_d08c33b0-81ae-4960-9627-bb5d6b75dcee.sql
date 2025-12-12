-- Remover constraint antiga
ALTER TABLE hotel_materials 
DROP CONSTRAINT IF EXISTS hotel_materials_material_type_check;

-- Recriar com o novo valor 'cliente_oculto'
ALTER TABLE hotel_materials 
ADD CONSTRAINT hotel_materials_material_type_check 
CHECK (material_type = ANY (ARRAY['manual'::text, 'dados'::text, 'transcricao'::text, 'reviews'::text, 'cliente_oculto'::text]));