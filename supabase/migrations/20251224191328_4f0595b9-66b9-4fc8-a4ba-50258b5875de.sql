-- Remove 7 unused color scheme columns
ALTER TABLE color_schemes DROP COLUMN IF EXISTS profile_header_bg;
ALTER TABLE color_schemes DROP COLUMN IF EXISTS profile_section_bg;
ALTER TABLE color_schemes DROP COLUMN IF EXISTS badge_bg;
ALTER TABLE color_schemes DROP COLUMN IF EXISTS badge_text;
ALTER TABLE color_schemes DROP COLUMN IF EXISTS quote_bg;
ALTER TABLE color_schemes DROP COLUMN IF EXISTS quote_border;
ALTER TABLE color_schemes DROP COLUMN IF EXISTS link_color;

-- Add new award_text column (initialized from cards_text)
ALTER TABLE color_schemes ADD COLUMN IF NOT EXISTS award_text TEXT;
UPDATE color_schemes SET award_text = cards_text WHERE award_text IS NULL;

-- Add new profile_text column (initialized from cards_text)
ALTER TABLE color_schemes ADD COLUMN IF NOT EXISTS profile_text TEXT;
UPDATE color_schemes SET profile_text = cards_text WHERE profile_text IS NULL;