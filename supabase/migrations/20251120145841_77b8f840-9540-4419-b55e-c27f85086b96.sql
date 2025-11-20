-- Add quote_id column to entity_appearances table
ALTER TABLE entity_appearances 
ADD COLUMN quote_id UUID REFERENCES collection_quotes(id) ON DELETE CASCADE;

-- Drop the old constraint
ALTER TABLE entity_appearances 
DROP CONSTRAINT IF EXISTS entity_appearances_reference_check;

-- Create the new comprehensive constraint that includes quote support
ALTER TABLE entity_appearances 
ADD CONSTRAINT entity_appearances_reference_check CHECK (
  (appearance_type = 'profile' AND profile_id IS NOT NULL) OR
  (appearance_type = 'lifeline' AND lifeline_id IS NOT NULL) OR
  (appearance_type = 'entry' AND entry_id IS NOT NULL) OR
  (appearance_type = 'collection' AND collection_id IS NOT NULL) OR
  (appearance_type = 'quote' AND quote_id IS NOT NULL)
);

-- Create index for performance on quote_id lookups
CREATE INDEX idx_entity_appearances_quote_id ON entity_appearances(quote_id);