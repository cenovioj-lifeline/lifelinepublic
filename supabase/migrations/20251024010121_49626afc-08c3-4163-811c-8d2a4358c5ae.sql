-- Add position fields to home_page_settings for hero image positioning
ALTER TABLE public.home_page_settings
ADD COLUMN hero_image_position_x INTEGER DEFAULT 50,
ADD COLUMN hero_image_position_y INTEGER DEFAULT 50;