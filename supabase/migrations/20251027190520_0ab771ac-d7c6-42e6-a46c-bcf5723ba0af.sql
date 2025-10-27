-- Add missing color fields to collections table for gradual migration
-- These will eventually be replaced by color_scheme_id references

ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS nav_button_color TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS banner_text_color TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS actions_bg_color TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS actions_border_color TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS actions_icon_color TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS actions_text_color TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS card_text_color TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS lifeline_display_border TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS lifeline_display_bg TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS lifeline_display_title_text TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS graph_bg_color TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS graph_line_color TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS graph_highlight_color TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS entry_header_bg TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS entry_header_text TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS entry_button_color TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS entry_title_text TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS entry_contributor_button TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS entry_bg_color TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS award_heading_text TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS award_heading_icon TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS award_heading_tag TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS award_icon_color TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS award_title_text TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS award_bg_color TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS award_border_color TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS profile_header_bg TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS profile_header_text TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS profile_card_bg TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS profile_card_border TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS default_color TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS link_color TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS link_hover_color TEXT;

COMMENT ON COLUMN public.collections.color_scheme_id IS 'New color scheme system - will eventually replace individual color columns';