-- Make occurred_on nullable in entries table
ALTER TABLE entries ALTER COLUMN occurred_on DROP NOT NULL;

COMMENT ON COLUMN entries.occurred_on IS 'Date of the event (optional - can be null for undated entries)';