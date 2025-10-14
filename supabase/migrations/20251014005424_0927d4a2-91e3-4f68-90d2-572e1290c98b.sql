-- Add is_featured flag to lifelines table
ALTER TABLE public.lifelines
ADD COLUMN is_featured boolean DEFAULT false;

-- Add is_featured flag to profile_collections junction table
ALTER TABLE public.profile_collections
ADD COLUMN is_featured boolean DEFAULT false;

-- Add index for better query performance
CREATE INDEX idx_lifelines_featured ON public.lifelines(collection_id, is_featured, status);
CREATE INDEX idx_profile_collections_featured ON public.profile_collections(collection_id, is_featured);

COMMENT ON COLUMN public.lifelines.is_featured IS 'Whether this lifeline should appear in the featured section of the collection';
COMMENT ON COLUMN public.profile_collections.is_featured IS 'Whether this profile should appear in the featured section of the collection';