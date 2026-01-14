-- Auto-populate Page Builder for all empty collection layouts
-- This inserts the exact content currently shown via the fallback logic

-- =============================================================================
-- STEP 1: Insert top 3 lifelines for each empty collection layout
-- =============================================================================
WITH ranked_lifelines AS (
  SELECT 
    pl.id as layout_id,
    l.id as lifeline_id,
    ROW_NUMBER() OVER (
      PARTITION BY pl.id 
      ORDER BY l.is_featured DESC NULLS LAST, l.cover_image_id DESC NULLS LAST, l.created_at DESC
    ) as rn
  FROM public.page_layouts pl
  JOIN public.lifelines l ON l.collection_id = pl.entity_id::uuid AND l.status = 'published'
  WHERE pl.page_type = 'collection'
    AND pl.entity_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.page_layout_items pli WHERE pli.layout_id = pl.id)
)
INSERT INTO public.page_layout_items (layout_id, item_type, item_id, display_order)
SELECT layout_id, 'lifeline', lifeline_id, rn - 1
FROM ranked_lifelines
WHERE rn <= 3;

-- =============================================================================
-- STEP 2: Insert top 3 profiles for each empty collection layout
-- (offset display_order by 100 to separate from lifelines visually)
-- =============================================================================
WITH ranked_profiles AS (
  SELECT 
    pl.id as layout_id,
    p.id as profile_id,
    ROW_NUMBER() OVER (
      PARTITION BY pl.id 
      ORDER BY pc.is_featured DESC NULLS LAST, p.avatar_image_id DESC NULLS LAST, p.created_at DESC
    ) as rn
  FROM public.page_layouts pl
  JOIN public.profile_collections pc ON pc.collection_id = pl.entity_id::uuid
  JOIN public.profiles p ON p.id = pc.profile_id AND p.status = 'published'
  WHERE pl.page_type = 'collection'
    AND pl.entity_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.page_layout_items pli WHERE pli.layout_id = pl.id)
)
INSERT INTO public.page_layout_items (layout_id, item_type, item_id, display_order)
SELECT layout_id, 'profile', profile_id, rn + 99
FROM ranked_profiles
WHERE rn <= 3;