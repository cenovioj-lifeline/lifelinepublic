-- Page Builder Tables Migration
-- Creates page_layouts and page_layout_items tables with proper RLS

-- Create page_layouts table
CREATE TABLE public.page_layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_type TEXT NOT NULL CHECK (page_type IN ('home', 'collection')),
    entity_id UUID,  -- NULL for home, collection_id for collections
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (page_type, entity_id)
);

-- Create page_layout_items table
CREATE TABLE public.page_layout_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layout_id UUID NOT NULL REFERENCES public.page_layouts(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('collection', 'profile', 'lifeline', 'election', 'book', 'action_card')),
    item_id UUID NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (layout_id, item_type, item_id)
);

-- Create indexes for performance
CREATE INDEX idx_page_layouts_type_entity ON public.page_layouts(page_type, entity_id);
CREATE INDEX idx_page_layout_items_layout ON public.page_layout_items(layout_id);
CREATE INDEX idx_page_layout_items_order ON public.page_layout_items(layout_id, display_order);

-- Enable RLS
ALTER TABLE public.page_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_layout_items ENABLE ROW LEVEL SECURITY;

-- Public read access for page_layouts
CREATE POLICY "Anyone can view page_layouts"
ON public.page_layouts
FOR SELECT
USING (true);

-- Public read access for page_layout_items
CREATE POLICY "Anyone can view page_layout_items"
ON public.page_layout_items
FOR SELECT
USING (true);

-- Restricted management for page_layouts (admins and collection editors)
CREATE POLICY "Admins and editors can manage page_layouts"
ON public.page_layouts
FOR ALL
TO authenticated
USING (
    -- Site admins can manage all layouts
    public.has_role(auth.uid(), 'admin')
    OR
    -- Collection editors can manage their collection's layout
    (page_type = 'collection' AND public.can_edit_collection(entity_id))
)
WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR
    (page_type = 'collection' AND public.can_edit_collection(entity_id))
);

-- Restricted management for page_layout_items (based on parent layout)
CREATE POLICY "Admins and editors can manage page_layout_items"
ON public.page_layout_items
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.page_layouts pl
        WHERE pl.id = layout_id
        AND (
            public.has_role(auth.uid(), 'admin')
            OR (pl.page_type = 'collection' AND public.can_edit_collection(pl.entity_id))
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.page_layouts pl
        WHERE pl.id = layout_id
        AND (
            public.has_role(auth.uid(), 'admin')
            OR (pl.page_type = 'collection' AND public.can_edit_collection(pl.entity_id))
        )
    )
);