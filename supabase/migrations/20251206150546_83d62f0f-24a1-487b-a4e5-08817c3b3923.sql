-- Create storage bucket for strategic materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('strategic-materials', 'strategic-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload strategic materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'strategic-materials');

-- Allow authenticated users to view files
CREATE POLICY "Authenticated users can view strategic materials"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'strategic-materials');

-- Allow authenticated users to delete their files
CREATE POLICY "Authenticated users can delete strategic materials"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'strategic-materials');

-- Allow public to view files (since bucket is public)
CREATE POLICY "Public can view strategic materials"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'strategic-materials');