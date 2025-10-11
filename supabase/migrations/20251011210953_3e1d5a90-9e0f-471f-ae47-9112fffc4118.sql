-- Update lifeline_type enum: profile -> person, event -> voting
-- First, update existing data
UPDATE lifelines SET lifeline_type = 'list' WHERE lifeline_type = 'event';

-- Drop the default temporarily
ALTER TABLE lifelines ALTER COLUMN lifeline_type DROP DEFAULT;

-- Alter the enum type
ALTER TYPE lifeline_type RENAME TO lifeline_type_old;
CREATE TYPE lifeline_type AS ENUM ('person', 'list', 'voting');

-- Update the column to use new enum
ALTER TABLE lifelines ALTER COLUMN lifeline_type TYPE lifeline_type USING 
  CASE 
    WHEN lifeline_type::text = 'profile' THEN 'person'::lifeline_type
    WHEN lifeline_type::text = 'list' THEN 'list'::lifeline_type
    ELSE 'list'::lifeline_type
  END;

-- Drop old enum
DROP TYPE lifeline_type_old;

-- Set new default
ALTER TABLE lifelines ALTER COLUMN lifeline_type SET DEFAULT 'person'::lifeline_type;