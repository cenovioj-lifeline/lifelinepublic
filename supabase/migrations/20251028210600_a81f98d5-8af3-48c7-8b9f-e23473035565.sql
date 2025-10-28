-- Allow public users to delete from entry_media (for removing image associations)
CREATE POLICY "Public can delete entry_media"
ON public.entry_media
FOR DELETE
TO public
USING (true);