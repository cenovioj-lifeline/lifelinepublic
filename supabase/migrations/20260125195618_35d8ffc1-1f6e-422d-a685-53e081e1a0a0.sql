-- Add card_label column to collections table
ALTER TABLE collections ADD COLUMN card_label TEXT;

-- Migrate existing hardcoded value for The Lifeline Story
UPDATE collections 
SET card_label = 'Investor Tour / Sales Pitch' 
WHERE slug = 'the-lifeline-story';