-- Add new profile_label_text column, initialized from cards_text
ALTER TABLE color_schemes ADD COLUMN IF NOT EXISTS profile_label_text TEXT;
UPDATE color_schemes SET profile_label_text = cards_text WHERE profile_label_text IS NULL;