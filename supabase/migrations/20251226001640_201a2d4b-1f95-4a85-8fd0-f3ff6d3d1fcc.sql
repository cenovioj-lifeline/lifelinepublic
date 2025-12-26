-- Add card image fields to collections for separate 16:9 card images
ALTER TABLE collections ADD COLUMN IF NOT EXISTS card_image_url TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS card_image_path TEXT;

COMMENT ON COLUMN collections.card_image_url IS 'Separate 16:9 image URL for collection cards. Falls back to hero_image_url if null.';
COMMENT ON COLUMN collections.card_image_path IS 'Storage path for card image.';

-- Add long_description to profiles for extended description
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS long_description TEXT;

COMMENT ON COLUMN profiles.long_description IS 'Extended description for profiles (2-6 paragraphs). Displays below short_description on profile page.';