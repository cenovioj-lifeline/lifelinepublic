-- Create collection_quotes table
CREATE TABLE public.collection_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  quote TEXT NOT NULL,
  author TEXT,
  context TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collection_quotes ENABLE ROW LEVEL SECURITY;

-- Admins and editors can manage quotes
CREATE POLICY "Admins and editors can manage collection_quotes"
ON public.collection_quotes
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

-- Public can view quotes for published collections
CREATE POLICY "Public can view collection_quotes"
ON public.collection_quotes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.collections
    WHERE collections.id = collection_quotes.collection_id
    AND collections.status = 'published'::content_status
  )
);

-- Add quote settings to collections table
ALTER TABLE public.collections
ADD COLUMN quotes_enabled BOOLEAN DEFAULT true,
ADD COLUMN quote_frequency INTEGER DEFAULT 1;