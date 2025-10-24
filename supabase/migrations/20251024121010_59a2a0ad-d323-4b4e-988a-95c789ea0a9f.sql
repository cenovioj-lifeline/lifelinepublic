-- Add quote submission support to fan_contributions
-- Update contribution_type to allow 'quote' type
ALTER TABLE public.fan_contributions 
  ADD COLUMN IF NOT EXISTS quote_text TEXT,
  ADD COLUMN IF NOT EXISTS quote_author TEXT,
  ADD COLUMN IF NOT EXISTS quote_context TEXT;

-- Add check constraint to ensure quote fields are populated for quote type
ALTER TABLE public.fan_contributions 
  ADD CONSTRAINT check_quote_fields 
  CHECK (
    (contribution_type != 'quote') OR 
    (contribution_type = 'quote' AND quote_text IS NOT NULL)
  );