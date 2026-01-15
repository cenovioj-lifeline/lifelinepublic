-- Add columns for custom link cards to page_layout_items
ALTER TABLE public.page_layout_items 
ADD COLUMN IF NOT EXISTS custom_title text,
ADD COLUMN IF NOT EXISTS custom_subtitle text,
ADD COLUMN IF NOT EXISTS custom_link text,
ADD COLUMN IF NOT EXISTS custom_image_url text;