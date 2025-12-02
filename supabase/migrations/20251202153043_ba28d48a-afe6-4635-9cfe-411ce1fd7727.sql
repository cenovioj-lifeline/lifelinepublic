-- Add sequence_label column for episode/sequence identifiers
ALTER TABLE entries ADD COLUMN IF NOT EXISTS sequence_label TEXT;
COMMENT ON COLUMN entries.sequence_label IS 'Episode/sequence identifier (e.g., S02E12) for media collections.';