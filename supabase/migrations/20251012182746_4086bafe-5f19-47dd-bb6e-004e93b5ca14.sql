-- Allow public access to view published collections
CREATE POLICY "Public can view published collections"
ON public.collections
FOR SELECT
USING (status = 'published');
