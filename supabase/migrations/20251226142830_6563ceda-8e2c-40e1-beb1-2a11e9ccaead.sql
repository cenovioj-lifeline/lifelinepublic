-- Add cover_image_id foreign key to books table for proper image management
ALTER TABLE books ADD COLUMN IF NOT EXISTS cover_image_id UUID REFERENCES media_assets(id);

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_books_cover_image_id ON books(cover_image_id);

COMMENT ON COLUMN books.cover_image_id IS 'FK to media_assets for the book cover image with position/scale tracking';