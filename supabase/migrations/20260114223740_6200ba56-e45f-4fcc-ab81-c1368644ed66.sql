-- Fix: Clean up duplicate home page layouts and add proper unique indexes

-- =============================================================================
-- STEP 1: Delete duplicate home layouts, keeping only the oldest one
-- =============================================================================
DELETE FROM public.page_layouts 
WHERE page_type = 'home' 
  AND entity_id IS NULL 
  AND id != 'a15a0529-95f0-4433-b4ad-64cc171c5280';

-- =============================================================================
-- STEP 2: Drop the existing unique constraint that doesn't handle NULL properly
-- =============================================================================
ALTER TABLE public.page_layouts DROP CONSTRAINT IF EXISTS page_layouts_unique_page;

-- =============================================================================
-- STEP 3: Create partial unique indexes that properly handle NULL entity_id
-- =============================================================================
-- For home page (entity_id IS NULL) - only one allowed per page_type
CREATE UNIQUE INDEX IF NOT EXISTS page_layouts_unique_home 
ON public.page_layouts (page_type) 
WHERE entity_id IS NULL;

-- For collection pages (entity_id IS NOT NULL) - one per page_type + entity_id combo
CREATE UNIQUE INDEX IF NOT EXISTS page_layouts_unique_collection 
ON public.page_layouts (page_type, entity_id) 
WHERE entity_id IS NOT NULL;