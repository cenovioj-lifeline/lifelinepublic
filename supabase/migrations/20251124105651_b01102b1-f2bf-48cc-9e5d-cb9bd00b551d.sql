-- Add profile linking columns to collection_quotes
ALTER TABLE collection_quotes 
ADD COLUMN author_profile_id uuid REFERENCES profiles(id),
ADD COLUMN author_profile_ids uuid[];

CREATE INDEX idx_collection_quotes_author_profile_id ON collection_quotes(author_profile_id);

-- Add profile linking to fan_contributions for quote submissions
ALTER TABLE fan_contributions
ADD COLUMN quote_author_profile_id uuid REFERENCES profiles(id);

-- Automatically map existing quotes to profiles based on author name
UPDATE collection_quotes cq
SET author_profile_id = p.id
FROM profiles p
WHERE LOWER(TRIM(cq.author)) = LOWER(p.name)
AND cq.author IS NOT NULL
AND cq.author_profile_id IS NULL;