-- Update default column count from 4 to 3 for new sections
ALTER TABLE page_layout_sections 
ALTER COLUMN columns_count SET DEFAULT 3;