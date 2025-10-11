-- Add missing fields to entries table for enhanced entry management
ALTER TABLE entries 
  ADD COLUMN IF NOT EXISTS collection_id uuid REFERENCES collections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tags text,
  ADD COLUMN IF NOT EXISTS related_lifelines text,
  ADD COLUMN IF NOT EXISTS media_suggestion text;

-- Add index for collection_id lookups
CREATE INDEX IF NOT EXISTS idx_entries_collection_id ON entries(collection_id);

-- Update RLS policies to allow collection-based queries
-- (existing policies already cover lifeline_id access)