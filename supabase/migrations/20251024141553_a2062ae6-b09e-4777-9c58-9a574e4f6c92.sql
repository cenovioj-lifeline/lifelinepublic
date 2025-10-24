-- Add separate position fields for collection card images
ALTER TABLE collections 
ADD COLUMN card_image_position_x integer DEFAULT 50,
ADD COLUMN card_image_position_y integer DEFAULT 50;