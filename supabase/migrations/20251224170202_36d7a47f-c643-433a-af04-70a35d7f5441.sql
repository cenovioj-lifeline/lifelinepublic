-- Add 8 new color fields for expanded control
ALTER TABLE public.color_schemes 
ADD COLUMN IF NOT EXISTS page_bg text DEFAULT '#f4e7d7',
ADD COLUMN IF NOT EXISTS profile_header_bg text DEFAULT '#352e28',
ADD COLUMN IF NOT EXISTS profile_section_bg text DEFAULT '#f4e7d7',
ADD COLUMN IF NOT EXISTS badge_bg text DEFAULT '#566950',
ADD COLUMN IF NOT EXISTS badge_text text DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS quote_bg text DEFAULT '#f4e7d7',
ADD COLUMN IF NOT EXISTS quote_border text DEFAULT '#352e28',
ADD COLUMN IF NOT EXISTS link_color text DEFAULT '#c05831';