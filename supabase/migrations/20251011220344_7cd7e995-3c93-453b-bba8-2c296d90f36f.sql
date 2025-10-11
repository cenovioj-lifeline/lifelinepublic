-- Add superlative_category and winner_name fields to election_results
ALTER TABLE election_results 
ADD COLUMN superlative_category text,
ADD COLUMN winner_name text;

-- Make winner_profile_id nullable (it already might be, but ensuring it)
ALTER TABLE election_results 
ALTER COLUMN winner_profile_id DROP NOT NULL;

-- Add array field for media asset IDs
ALTER TABLE election_results
ADD COLUMN media_ids uuid[] DEFAULT '{}';

-- Add comments
COMMENT ON COLUMN election_results.category IS 'Main category (e.g., "Most Likely to..." or "Style & Appearance Awards")';
COMMENT ON COLUMN election_results.superlative_category IS 'Specific superlative (e.g., "Most Likely to Succeed")';
COMMENT ON COLUMN election_results.winner_name IS 'Winner as free text (used when not linking to a profile)';
COMMENT ON COLUMN election_results.winner_profile_id IS 'Winner linked to a profile (optional)';
COMMENT ON COLUMN election_results.media_ids IS 'Array of media asset IDs for images associated with this result';