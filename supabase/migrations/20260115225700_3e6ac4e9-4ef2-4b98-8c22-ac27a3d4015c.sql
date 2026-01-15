-- Create table for pitch book images
CREATE TABLE public.pitch_book_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_num INTEGER NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  image_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pitch_book_images ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view pitch book images"
ON public.pitch_book_images FOR SELECT USING (true);

-- Admin/editor write access
CREATE POLICY "Admins can insert pitch book images"
ON public.pitch_book_images FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Admins can update pitch book images"
ON public.pitch_book_images FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Admins can delete pitch book images"
ON public.pitch_book_images FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'editor')
  )
);