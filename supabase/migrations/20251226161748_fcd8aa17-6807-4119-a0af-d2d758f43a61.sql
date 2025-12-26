-- Add light_text_color and dark_text_color to color_schemes table
-- These provide guaranteed-readable text colors for contrast pairing

ALTER TABLE public.color_schemes
ADD COLUMN IF NOT EXISTS light_text_color text DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS dark_text_color text DEFAULT '#1f2937';

-- Update existing schemes with sensible defaults
UPDATE public.color_schemes
SET 
  light_text_color = COALESCE(light_text_color, '#ffffff'),
  dark_text_color = COALESCE(dark_text_color, '#1f2937')
WHERE light_text_color IS NULL OR dark_text_color IS NULL;