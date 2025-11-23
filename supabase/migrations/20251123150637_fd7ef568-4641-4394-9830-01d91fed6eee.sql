-- Add serpapi_query column to lifelines table for custom cover image search queries
ALTER TABLE lifelines ADD COLUMN serpapi_query text NULL;

COMMENT ON COLUMN lifelines.serpapi_query IS 'Custom SerpAPI search query for finding lifeline cover images. If null, modal opens with empty search box.';