-- Add scale column to media_assets table
ALTER TABLE media_assets 
ADD COLUMN scale DECIMAL DEFAULT 1.0 CHECK (scale >= 0.5 AND scale <= 3.0);

COMMENT ON COLUMN media_assets.scale IS 'Scale/zoom level for image positioning (0.5 to 3.0, default 1.0)';