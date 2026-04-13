ALTER TABLE public.agent_results ADD COLUMN IF NOT EXISTS pdf_url TEXT DEFAULT NULL;

-- Create storage bucket for presentation PDFs (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('presentations-pdf', 'presentations-pdf', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to the bucket
CREATE POLICY IF NOT EXISTS "Public read presentations-pdf"
ON storage.objects FOR SELECT
USING (bucket_id = 'presentations-pdf');

-- Allow service role to upload/overwrite
CREATE POLICY IF NOT EXISTS "Service role upload presentations-pdf"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'presentations-pdf');

CREATE POLICY IF NOT EXISTS "Service role update presentations-pdf"
ON storage.objects FOR UPDATE
USING (bucket_id = 'presentations-pdf');
