-- Create storage bucket for media uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('media-uploads', 'media-uploads', true);

-- RLS Policy: Allow authenticated admins and editors to upload files
CREATE POLICY "Admins and editors can upload media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media-uploads' AND
  (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role))
);

-- RLS Policy: Allow authenticated admins and editors to update files
CREATE POLICY "Admins and editors can update media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media-uploads' AND
  (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role))
);

-- RLS Policy: Allow authenticated admins and editors to delete files
CREATE POLICY "Admins and editors can delete media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'media-uploads' AND
  (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role))
);

-- RLS Policy: Allow all authenticated users to view files
CREATE POLICY "Authenticated users can view media"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'media-uploads');