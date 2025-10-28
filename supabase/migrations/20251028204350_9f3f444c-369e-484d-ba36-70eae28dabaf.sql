-- Allow public users to insert media assets
CREATE POLICY "Public can create media_assets"
ON public.media_assets
FOR INSERT
TO public
WITH CHECK (true);

-- Allow public users to link media to entries
CREATE POLICY "Public can create entry_media"
ON public.entry_media
FOR INSERT
TO public
WITH CHECK (true);

-- Allow public users to view media assets (for the uploaded image display)
CREATE POLICY "Public can view media_assets"
ON public.media_assets
FOR SELECT
TO public
USING (true);