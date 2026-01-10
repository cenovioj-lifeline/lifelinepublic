-- Add navigation control flags to collections table
ALTER TABLE collections ADD COLUMN IF NOT EXISTS pitch_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS home_hidden BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN collections.pitch_enabled IS 'When true, shows Pitch nav item in collection header';
COMMENT ON COLUMN collections.home_hidden IS 'When true, hides Home nav item from collection header';

-- Update the lifeline-inc collection to use these new flags
UPDATE collections
SET pitch_enabled = TRUE, home_hidden = TRUE
WHERE slug = 'lifeline-inc';