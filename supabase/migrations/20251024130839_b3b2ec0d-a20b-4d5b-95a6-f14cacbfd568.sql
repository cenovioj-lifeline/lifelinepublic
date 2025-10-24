-- Add position fields for collection hero images
ALTER TABLE collections 
ADD COLUMN hero_image_position_x INTEGER DEFAULT 50,
ADD COLUMN hero_image_position_y INTEGER DEFAULT 50;

COMMENT ON COLUMN collections.hero_image_position_x IS 'Horizontal position of hero image (0-100%)';
COMMENT ON COLUMN collections.hero_image_position_y IS 'Vertical position of hero image (0-100%)';