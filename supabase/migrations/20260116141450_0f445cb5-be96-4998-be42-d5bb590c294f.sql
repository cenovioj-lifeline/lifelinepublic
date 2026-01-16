-- Add collection_id to books table
ALTER TABLE books 
ADD COLUMN collection_id UUID REFERENCES collections(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_books_collection_id ON books(collection_id);