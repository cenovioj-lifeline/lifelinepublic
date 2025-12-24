-- Add filter_controls_text column for search inputs, dropdowns, pagination
ALTER TABLE color_schemes ADD COLUMN filter_controls_text TEXT DEFAULT '#1f2937';

-- Add award_category_bg column for award category header background
ALTER TABLE color_schemes ADD COLUMN award_category_bg TEXT;

-- Add award_item_bg column for individual award item backgrounds
ALTER TABLE color_schemes ADD COLUMN award_item_bg TEXT DEFAULT '#ffffff';

-- Preserve current appearance by copying cards_bg to award_category_bg
UPDATE color_schemes SET award_category_bg = cards_bg WHERE award_category_bg IS NULL;