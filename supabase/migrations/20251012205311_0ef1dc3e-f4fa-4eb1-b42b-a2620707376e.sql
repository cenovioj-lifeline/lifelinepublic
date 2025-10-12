-- Add support for multiple winner profiles in election results
ALTER TABLE election_results 
ADD COLUMN winner_profile_ids uuid[] DEFAULT '{}';

-- Migrate existing single winner_profile_id to the array column
UPDATE election_results 
SET winner_profile_ids = ARRAY[winner_profile_id]
WHERE winner_profile_id IS NOT NULL;

-- Add a comment explaining the columns
COMMENT ON COLUMN election_results.winner_profile_id IS 'Deprecated: Use winner_profile_ids array instead';
COMMENT ON COLUMN election_results.winner_profile_ids IS 'Array of profile UUIDs for multiple winners';