-- Add image_query field to profiles table
-- This stores the SerpAPI search query for finding the profile's primary image
-- Generated at profile creation time (inception query pattern)

ALTER TABLE profiles
ADD COLUMN image_query TEXT;

-- Add comment to document the field
COMMENT ON COLUMN profiles.image_query IS 'SerpAPI search query for profile image (4-7 keywords, generated at creation time)';