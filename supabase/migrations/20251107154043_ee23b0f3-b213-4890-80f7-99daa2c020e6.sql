-- Create collection_featured_items table
CREATE TABLE public.collection_featured_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collection_custom_section_items table (replaces "new content")
CREATE TABLE public.collection_custom_section_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add custom section name to collections
ALTER TABLE public.collections
ADD COLUMN custom_section_name TEXT DEFAULT 'New Content';

-- Add custom section name to home_page_settings
ALTER TABLE public.home_page_settings
ADD COLUMN custom_section_name TEXT DEFAULT 'New Content';

-- Enable RLS
ALTER TABLE public.collection_featured_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_custom_section_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for collection_featured_items
CREATE POLICY "Admins and editors can manage collection_featured_items"
ON public.collection_featured_items
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

CREATE POLICY "Public can view collection_featured_items"
ON public.collection_featured_items
FOR SELECT
TO public
USING (true);

-- RLS policies for collection_custom_section_items
CREATE POLICY "Admins and editors can manage collection_custom_section_items"
ON public.collection_custom_section_items
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

CREATE POLICY "Public can view collection_custom_section_items"
ON public.collection_custom_section_items
FOR SELECT
TO public
USING (true);