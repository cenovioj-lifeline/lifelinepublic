-- Add entity_id to lifelines table
ALTER TABLE lifelines
ADD COLUMN IF NOT EXISTS entity_id TEXT;

CREATE INDEX IF NOT EXISTS idx_lifelines_entity_id
ON lifelines(entity_id);

-- Add entity_id to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS entity_id TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_entity_id
ON profiles(entity_id);