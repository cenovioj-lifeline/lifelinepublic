-- Reorganize color_schemes table to match user's numbering
-- Add missing color columns and prepare to remap existing ones

-- Add new columns that are missing
ALTER TABLE color_schemes ADD COLUMN IF NOT EXISTS ll_entry_title_text text DEFAULT '#000000';
ALTER TABLE color_schemes ADD COLUMN IF NOT EXISTS ll_graph_bg text DEFAULT '#FFFFFF';  
ALTER TABLE color_schemes ADD COLUMN IF NOT EXISTS ch_banner_text text DEFAULT '#FFFFFF';
ALTER TABLE color_schemes ADD COLUMN IF NOT EXISTS ch_actions_bg text DEFAULT '#F5F5F5';
ALTER TABLE color_schemes ADD COLUMN IF NOT EXISTS ch_actions_border text DEFAULT '#E0E0E0';
ALTER TABLE color_schemes ADD COLUMN IF NOT EXISTS ch_actions_icon text DEFAULT '#333333';
ALTER TABLE color_schemes ADD COLUMN IF NOT EXISTS ch_actions_text text DEFAULT '#333333';
ALTER TABLE color_schemes ADD COLUMN IF NOT EXISTS cards_bg text DEFAULT '#FFFFFF';
ALTER TABLE color_schemes ADD COLUMN IF NOT EXISTS cards_border text DEFAULT '#E0E0E0';
ALTER TABLE color_schemes ADD COLUMN IF NOT EXISTS cards_text text DEFAULT '#333333';
ALTER TABLE color_schemes ADD COLUMN IF NOT EXISTS title_text text DEFAULT '#000000';
ALTER TABLE color_schemes ADD COLUMN IF NOT EXISTS award_bg text DEFAULT '#FFFFFF';
ALTER TABLE color_schemes ADD COLUMN IF NOT EXISTS award_border text DEFAULT '#E0E0E0';

-- Copy data from old columns to new columns where applicable
UPDATE color_schemes SET
  ch_banner_text = banner_text_color,
  ch_actions_bg = actions_bg_color,
  ch_actions_border = actions_border_color,
  ch_actions_icon = actions_icon_color,
  ch_actions_text = actions_text_color,
  cards_bg = card_bg_color,
  cards_border = card_border_color,
  cards_text = card_text_color,
  title_text = ll_display_title_text,
  award_bg = card_bg_color,  -- Use card bg as fallback
  award_border = card_border_color,  -- Use card border as fallback
  ll_entry_title_text = ll_display_title_text,  -- Use display title as fallback
  ll_graph_bg = ll_display_bg  -- Use display bg as fallback
WHERE ch_banner_text IS NULL OR ch_banner_text = '#FFFFFF';

-- Drop old redundant columns that are now duplicates
ALTER TABLE color_schemes DROP COLUMN IF EXISTS banner_text_color;
ALTER TABLE color_schemes DROP COLUMN IF EXISTS actions_bg_color;
ALTER TABLE color_schemes DROP COLUMN IF EXISTS actions_border_color;
ALTER TABLE color_schemes DROP COLUMN IF EXISTS actions_icon_color;
ALTER TABLE color_schemes DROP COLUMN IF EXISTS actions_text_color;
ALTER TABLE color_schemes DROP COLUMN IF EXISTS card_bg_color;
ALTER TABLE color_schemes DROP COLUMN IF EXISTS card_border_color;
ALTER TABLE color_schemes DROP COLUMN IF EXISTS card_text_color;
ALTER TABLE color_schemes DROP COLUMN IF EXISTS ll_display_border;  -- This is duplicate of nav_bg_color
ALTER TABLE color_schemes DROP COLUMN IF EXISTS ll_entry_header;  -- This is duplicate of nav_bg_color  
ALTER TABLE color_schemes DROP COLUMN IF EXISTS ll_entry_button;  -- This is duplicate of nav_button_color
ALTER TABLE color_schemes DROP COLUMN IF EXISTS ll_graph_line;  -- Moving to ll_graph_bg