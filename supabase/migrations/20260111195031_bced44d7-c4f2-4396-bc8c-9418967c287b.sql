-- Add hero_image_url and hero_image_path columns to home_page_settings
ALTER TABLE public.home_page_settings 
ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
ADD COLUMN IF NOT EXISTS hero_image_path TEXT;