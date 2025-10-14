-- Make title and description nullable to support image contributions
ALTER TABLE public.fan_contributions
ALTER COLUMN title DROP NOT NULL,
ALTER COLUMN description DROP NOT NULL;

COMMENT ON COLUMN public.fan_contributions.title IS 'Title of the event contribution (required for event type, null for image type)';
COMMENT ON COLUMN public.fan_contributions.description IS 'Description of the event contribution (required for event type, null for image type)';