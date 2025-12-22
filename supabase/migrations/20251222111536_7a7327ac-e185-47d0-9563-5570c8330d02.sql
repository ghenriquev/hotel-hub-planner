-- Atualizar política SELECT da tabela hotels
DROP POLICY IF EXISTS "Users can view own hotels or admins can view all" ON hotels;

CREATE POLICY "Authenticated users can view all hotels"
ON hotels FOR SELECT
TO authenticated
USING (true);

-- Atualizar política SELECT da tabela agent_results
DROP POLICY IF EXISTS "Users can view agent results of own hotels" ON agent_results;

CREATE POLICY "Authenticated users can view all agent results"
ON agent_results FOR SELECT
TO authenticated
USING (true);

-- Atualizar política SELECT da tabela hotel_materials
DROP POLICY IF EXISTS "Users can view materials of own hotels" ON hotel_materials;

CREATE POLICY "Authenticated users can view all hotel materials"
ON hotel_materials FOR SELECT
TO authenticated
USING (true);