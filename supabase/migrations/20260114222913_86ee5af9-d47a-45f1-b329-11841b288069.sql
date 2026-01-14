-- Data Migration: Populate page_layouts and page_layout_items from legacy tables
-- Fixed: Removed enum casts since item_type is TEXT, not an enum

-- =============================================================================
-- STEP 1: Create the Home Page Layout (if not exists)
-- =============================================================================
INSERT INTO public.page_layouts (page_type, entity_id)
VALUES ('home', NULL)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- STEP 2: Create Layouts for All Collections
-- =============================================================================
INSERT INTO public.page_layouts (page_type, entity_id)
SELECT 'collection', id
FROM public.collections
ON CONFLICT DO NOTHING;

-- =============================================================================
-- STEP 3: Migrate home_page_featured_items → page_layout_items
-- =============================================================================
INSERT INTO public.page_layout_items (layout_id, item_type, item_id, display_order)
SELECT
    pl.id AS layout_id,
    hpfi.item_type AS item_type,
    hpfi.item_id,
    hpfi.order_index AS display_order
FROM public.home_page_featured_items hpfi
JOIN public.page_layouts pl ON pl.page_type = 'home' AND pl.entity_id IS NULL
ON CONFLICT (layout_id, item_type, item_id) DO NOTHING;

-- =============================================================================
-- STEP 4: Migrate home_page_new_content_items → page_layout_items
-- =============================================================================
INSERT INTO public.page_layout_items (layout_id, item_type, item_id, display_order)
SELECT
    pl.id AS layout_id,
    hpnci.item_type AS item_type,
    hpnci.item_id,
    hpnci.order_index + 1000 AS display_order
FROM public.home_page_new_content_items hpnci
JOIN public.page_layouts pl ON pl.page_type = 'home' AND pl.entity_id IS NULL
ON CONFLICT (layout_id, item_type, item_id) DO NOTHING;

-- =============================================================================
-- STEP 5: Migrate collection_featured_items → page_layout_items
-- =============================================================================
INSERT INTO public.page_layout_items (layout_id, item_type, item_id, display_order)
SELECT
    pl.id AS layout_id,
    cfi.item_type AS item_type,
    cfi.item_id,
    cfi.order_index AS display_order
FROM public.collection_featured_items cfi
JOIN public.page_layouts pl ON pl.page_type = 'collection' AND pl.entity_id = cfi.collection_id
ON CONFLICT (layout_id, item_type, item_id) DO NOTHING;

-- =============================================================================
-- STEP 6: Migrate collection_custom_section_items → page_layout_items
-- =============================================================================
INSERT INTO public.page_layout_items (layout_id, item_type, item_id, display_order)
SELECT
    pl.id AS layout_id,
    ccsi.item_type AS item_type,
    ccsi.item_id,
    ccsi.order_index + 1000 AS display_order
FROM public.collection_custom_section_items ccsi
JOIN public.page_layouts pl ON pl.page_type = 'collection' AND pl.entity_id = ccsi.collection_id
ON CONFLICT (layout_id, item_type, item_id) DO NOTHING;

-- =============================================================================
-- STEP 7: Migrate collection_action_cards → page_layout_items
-- =============================================================================
INSERT INTO public.page_layout_items (layout_id, item_type, item_id, display_order)
SELECT
    pl.id AS layout_id,
    'action_card' AS item_type,
    cac.action_card_id AS item_id,
    COALESCE(cac.display_order, 0) + 2000 AS display_order
FROM public.collection_action_cards cac
JOIN public.page_layouts pl ON pl.page_type = 'collection' AND pl.entity_id = cac.collection_id
WHERE cac.is_enabled = true
ON CONFLICT (layout_id, item_type, item_id) DO NOTHING;