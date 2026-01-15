-- Add image positioning columns for custom link cards
ALTER TABLE page_layout_items 
ADD COLUMN IF NOT EXISTS custom_image_position_x integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS custom_image_position_y integer DEFAULT 50;