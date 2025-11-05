-- Add target_name column to profile_relationships to store unresolved target names
ALTER TABLE profile_relationships 
ADD COLUMN IF NOT EXISTS target_name TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN profile_relationships.target_name IS 'Stores the name of the target profile when related_profile_id cannot be resolved yet. Used for pending relationship resolution.';