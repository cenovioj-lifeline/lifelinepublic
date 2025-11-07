-- Add image fields to mock_elections table
ALTER TABLE mock_elections
ADD COLUMN IF NOT EXISTS hero_image_url text,
ADD COLUMN IF NOT EXISTS hero_image_path text,
ADD COLUMN IF NOT EXISTS hero_image_position_x integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS hero_image_position_y integer DEFAULT 50;