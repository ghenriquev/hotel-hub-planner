-- Add file upload support for manual de funcionamento
ALTER TABLE public.hotel_manual_data
ADD COLUMN IF NOT EXISTS uploaded_file_url TEXT,
ADD COLUMN IF NOT EXISTS uploaded_file_name TEXT,
ADD COLUMN IF NOT EXISTS input_method TEXT DEFAULT 'form';

-- Add comment for documentation
COMMENT ON COLUMN public.hotel_manual_data.input_method IS 'How the manual was submitted: form or upload';