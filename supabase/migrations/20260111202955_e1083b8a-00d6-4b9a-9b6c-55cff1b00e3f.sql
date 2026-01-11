-- Add card-specific positioning columns to media_assets table
-- These store the 16:9 card crop position, separate from 1:1 avatar position
ALTER TABLE media_assets
ADD COLUMN IF NOT EXISTS card_position_x integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS card_position_y integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS card_scale numeric DEFAULT 1;