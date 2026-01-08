-- Allow anonymous users to read agent configs (for public client view)
CREATE POLICY "Public can read agent configs" ON agent_configs
  FOR SELECT
  TO anon
  USING (true);