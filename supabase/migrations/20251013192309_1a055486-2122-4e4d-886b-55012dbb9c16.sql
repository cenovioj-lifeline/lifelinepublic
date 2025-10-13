-- Add position columns to media_assets table for image positioning
ALTER TABLE public.media_assets 
ADD COLUMN IF NOT EXISTS position_x integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS position_y integer DEFAULT 50;

COMMENT ON COLUMN public.media_assets.position_x IS 'Horizontal position percentage (0-100) for image display';
COMMENT ON COLUMN public.media_assets.position_y IS 'Vertical position percentage (0-100) for image display';