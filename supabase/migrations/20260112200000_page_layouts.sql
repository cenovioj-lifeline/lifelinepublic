-- Page Builder: Unified layout system for home page and collection pages
-- This replaces the separate Home Manager and Collection Homepage Editor

-- Table: page_layouts
-- Stores one layout per page (home or collection)
CREATE TABLE IF NOT EXISTS page_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What page is this layout for?
  page_type TEXT NOT NULL CHECK (page_type IN ('home', 'collection')),
  entity_id UUID,  -- NULL for home, collection_id for collections
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- One layout per page
  CONSTRAINT unique_page_layout UNIQUE (page_type, entity_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_page_layouts_type_entity ON page_layouts(page_type, entity_id);

-- Table: page_layout_items
-- Stores the cards/items that appear on a page layout
CREATE TABLE IF NOT EXISTS page_layout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Which layout does this belong to?
  layout_id UUID NOT NULL REFERENCES page_layouts(id) ON DELETE CASCADE,
  
  -- What content does this card represent?
  item_type TEXT NOT NULL CHECK (item_type IN ('collection', 'profile', 'lifeline', 'election', 'book', 'action_card')),
  item_id UUID NOT NULL,  -- FK to the actual content table
  
  -- Where in the grid?
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent duplicate cards on same layout
  CONSTRAINT unique_layout_item UNIQUE (layout_id, item_type, item_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_page_layout_items_layout ON page_layout_items(layout_id);
CREATE INDEX IF NOT EXISTS idx_page_layout_items_order ON page_layout_items(layout_id, display_order);

-- Enable Row Level Security
ALTER TABLE page_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_layout_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read, authenticated write
CREATE POLICY "Public can read page_layouts" ON page_layouts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert page_layouts" ON page_layouts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update page_layouts" ON page_layouts
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete page_layouts" ON page_layouts
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Public can read page_layout_items" ON page_layout_items
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert page_layout_items" ON page_layout_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update page_layout_items" ON page_layout_items
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete page_layout_items" ON page_layout_items
  FOR DELETE USING (auth.role() = 'authenticated');

-- Trigger to update updated_at on page_layouts
CREATE OR REPLACE FUNCTION update_page_layouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER page_layouts_updated_at
  BEFORE UPDATE ON page_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_page_layouts_updated_at();
