-- Drop the old constraint
ALTER TABLE page_layout_items 
DROP CONSTRAINT IF EXISTS page_layout_items_item_type_check;

-- Add the new constraint with custom_link included
ALTER TABLE page_layout_items 
ADD CONSTRAINT page_layout_items_item_type_check 
CHECK (item_type = ANY (ARRAY[
  'collection'::text, 
  'profile'::text, 
  'lifeline'::text, 
  'election'::text, 
  'book'::text, 
  'action_card'::text,
  'custom_link'::text
]));