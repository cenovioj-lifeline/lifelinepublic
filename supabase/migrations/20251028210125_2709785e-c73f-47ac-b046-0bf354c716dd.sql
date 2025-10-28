-- Allow public users to upload to media-uploads storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('media-uploads', 'media-uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Public can upload to media-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public can view media-uploads" ON storage.objects;

-- Allow public users to insert files into media-uploads bucket
CREATE POLICY "Public can upload to media-uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'media-uploads');

-- Allow public users to view files in media-uploads bucket
CREATE POLICY "Public can view media-uploads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'media-uploads');