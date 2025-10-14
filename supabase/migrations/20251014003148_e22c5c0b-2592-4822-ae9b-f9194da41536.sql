-- Add image support to fan_contributions table
ALTER TABLE public.fan_contributions
ADD COLUMN contribution_type text NOT NULL DEFAULT 'event',
ADD COLUMN media_id uuid REFERENCES public.media_assets(id),
ADD COLUMN entry_ref uuid REFERENCES public.entries(id);

-- Add check constraint for contribution types
ALTER TABLE public.fan_contributions
ADD CONSTRAINT valid_contribution_type 
CHECK (contribution_type IN ('event', 'image'));

-- Add constraint to ensure event contributions have required fields
ALTER TABLE public.fan_contributions
ADD CONSTRAINT event_contribution_fields
CHECK (
  (contribution_type = 'event' AND title IS NOT NULL AND description IS NOT NULL) OR
  (contribution_type = 'image' AND media_id IS NOT NULL AND entry_ref IS NOT NULL)
);

COMMENT ON COLUMN public.fan_contributions.contribution_type IS 'Type of contribution: event (new entry) or image (media for existing entry)';
COMMENT ON COLUMN public.fan_contributions.media_id IS 'Reference to media_assets for image contributions';
COMMENT ON COLUMN public.fan_contributions.entry_ref IS 'Reference to the entry this image is being contributed to';