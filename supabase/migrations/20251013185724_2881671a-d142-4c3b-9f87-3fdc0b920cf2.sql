-- Add collection_tags column to media_assets for filtering/grouping
ALTER TABLE media_assets 
ADD COLUMN collection_tags TEXT[] DEFAULT '{}';

-- Create index for better query performance on collection_tags
CREATE INDEX idx_media_assets_collection_tags ON media_assets USING GIN(collection_tags);