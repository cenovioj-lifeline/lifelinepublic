-- Data Migration: Migrate existing home page and collection data to unified page_layouts
-- Run this AFTER the page_layouts and page_layout_items tables are created

-- ============================================
-- STEP 1: Create home page layout
-- ============================================
INSERT INTO page_layouts (page_type, entity_id)
VALUES ('home', NULL)
ON CONFLICT (page_type, entity_id) DO NOTHING;

-- ============================================
-- STEP 2: Migrate home_page_featured_items to page_layout_items
-- ============================================
WITH home_layout AS (
  SELECT id FROM page_layouts WHERE page_type = 'home' AND entity_id IS NULL
)
INSERT INTO page_layout_items (layout_id, item_type, item_id, display_order)
SELECT
  (SELECT id FROM home_layout),
  hpfi.item_type,
  hpfi.item_id,
  hpfi.order_index
FROM home_page_featured_items hpfi
WHERE EXISTS (SELECT 1 FROM home_layout)
ON CONFLICT (layout_id, item_type, item_id) DO NOTHING;

-- ============================================
-- STEP 3: Migrate home_page_new_content_items to page_layout_items
-- Offset by 1000 to ensure they come after featured items
-- ============================================
WITH home_layout AS (
  SELECT id FROM page_layouts WHERE page_type = 'home' AND entity_id IS NULL
)
INSERT INTO page_layout_items (layout_id, item_type, item_id, display_order)
SELECT
  (SELECT id FROM home_layout),
  hpnci.item_type,
  hpnci.item_id,
  hpnci.order_index + 1000  -- Offset to come after featured
FROM home_page_new_content_items hpnci
WHERE EXISTS (SELECT 1 FROM home_layout)
ON CONFLICT (layout_id, item_type, item_id) DO NOTHING;

-- ============================================
-- STEP 4: Create layouts for all existing collections
-- ============================================
INSERT INTO page_layouts (page_type, entity_id)
SELECT 'collection', id 
FROM collections
ON CONFLICT (page_type, entity_id) DO NOTHING;

-- ============================================
-- STEP 5: Migrate collection_featured_items (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'collection_featured_items') THEN
    INSERT INTO page_layout_items (layout_id, item_type, item_id, display_order)
    SELECT
      pl.id,
      cfi.item_type,
      cfi.item_id,
      COALESCE(cfi.display_order, cfi.order_index, 0)
    FROM collection_featured_items cfi
    JOIN page_layouts pl ON pl.entity_id = cfi.collection_id AND pl.page_type = 'collection'
    ON CONFLICT (layout_id, item_type, item_id) DO NOTHING;
  END IF;
END $$;

-- ============================================
-- STEP 6: Migrate collection_custom_section_items (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'collection_custom_section_items') THEN
    INSERT INTO page_layout_items (layout_id, item_type, item_id, display_order)
    SELECT
      pl.id,
      ccsi.item_type,
      ccsi.item_id,
      COALESCE(ccsi.display_order, ccsi.order_index, 0) + 1000  -- Offset
    FROM collection_custom_section_items ccsi
    JOIN page_layouts pl ON pl.entity_id = ccsi.collection_id AND pl.page_type = 'collection'
    ON CONFLICT (layout_id, item_type, item_id) DO NOTHING;
  END IF;
END $$;

-- ============================================
-- STEP 7: Migrate collection_action_cards (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'collection_action_cards') THEN
    INSERT INTO page_layout_items (layout_id, item_type, item_id, display_order)
    SELECT
      pl.id,
      'action_card',
      cac.action_card_id,
      COALESCE(cac.display_order, cac.order_index, 0) + 2000  -- Offset to come last
    FROM collection_action_cards cac
    JOIN page_layouts pl ON pl.entity_id = cac.collection_id AND pl.page_type = 'collection'
    WHERE cac.is_enabled = true
    ON CONFLICT (layout_id, item_type, item_id) DO NOTHING;
  END IF;
END $$;

-- ============================================
-- Note: After verifying migration success, the old tables can be deprecated:
-- - home_page_featured_items
-- - home_page_new_content_items  
-- - collection_featured_items
-- - collection_custom_section_items
-- - collection_action_cards
--
-- Do NOT drop these until the new Page Builder is fully working.
-- ============================================
