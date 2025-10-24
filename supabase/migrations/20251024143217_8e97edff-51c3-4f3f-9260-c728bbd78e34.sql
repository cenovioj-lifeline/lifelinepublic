-- Add cover image position fields to lifelines table
ALTER TABLE lifelines
ADD COLUMN cover_image_position_x integer DEFAULT 50,
ADD COLUMN cover_image_position_y integer DEFAULT 50;