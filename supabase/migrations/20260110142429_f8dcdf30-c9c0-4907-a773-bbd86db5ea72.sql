-- Add navigation control flags to collections table
-- pitch_enabled: Shows "Pitch" nav item when true
-- home_hidden: Hides "Home" nav item when true

ALTER TABLE collections ADD COLUMN IF NOT EXISTS pitch_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS home_hidden BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN collections.pitch_enabled IS 'When true, shows Pitch nav item in collection header';
COMMENT ON COLUMN collections.home_hidden IS 'When true, hides Home nav item from collection header';
