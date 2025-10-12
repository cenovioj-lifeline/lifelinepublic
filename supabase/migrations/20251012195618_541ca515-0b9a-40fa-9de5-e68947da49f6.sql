-- Add optional menu color fields to collections table
ALTER TABLE collections
ADD COLUMN menu_text_color text,
ADD COLUMN menu_hover_color text,
ADD COLUMN menu_active_color text;