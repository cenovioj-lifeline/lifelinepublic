-- Add show_action_cards toggle to collections
ALTER TABLE public.collections 
ADD COLUMN IF NOT EXISTS show_action_cards BOOLEAN DEFAULT true;

-- Create page_layout_sections table for multi-row layouts with section titles
CREATE TABLE public.page_layout_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_id UUID NOT NULL REFERENCES public.page_layouts(id) ON DELETE CASCADE,
  section_title TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  columns_count INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add section_id to page_layout_items
ALTER TABLE public.page_layout_items 
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.page_layout_sections(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_page_layout_sections_layout_id ON public.page_layout_sections(layout_id);
CREATE INDEX idx_page_layout_items_section_id ON public.page_layout_items(section_id);

-- Enable RLS on new table
ALTER TABLE public.page_layout_sections ENABLE ROW LEVEL SECURITY;

-- Allow public read access (same as page_layouts)
CREATE POLICY "Allow public read access to page_layout_sections"
ON public.page_layout_sections FOR SELECT
USING (true);

-- Allow authenticated users to manage sections (admin functionality)
CREATE POLICY "Allow authenticated users to manage page_layout_sections"
ON public.page_layout_sections FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);