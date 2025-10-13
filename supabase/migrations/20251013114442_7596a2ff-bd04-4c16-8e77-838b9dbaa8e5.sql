-- Add comprehensive color columns to collections table
ALTER TABLE public.collections
ADD COLUMN collection_bg_color TEXT,
ADD COLUMN collection_text_color TEXT,
ADD COLUMN collection_heading_color TEXT,
ADD COLUMN collection_accent_color TEXT,
ADD COLUMN collection_card_bg TEXT,
ADD COLUMN collection_border_color TEXT,
ADD COLUMN collection_muted_text TEXT,
ADD COLUMN collection_badge_color TEXT;