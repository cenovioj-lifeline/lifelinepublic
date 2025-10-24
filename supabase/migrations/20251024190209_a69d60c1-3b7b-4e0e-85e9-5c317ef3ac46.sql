-- Add direct image URL columns to tables
ALTER TABLE collections 
ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
ADD COLUMN IF NOT EXISTS hero_image_path TEXT;

ALTER TABLE lifelines 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_path TEXT;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_image_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_image_path TEXT;

-- Create a new table for entry images with direct storage
CREATE TABLE IF NOT EXISTS entry_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_path TEXT NOT NULL,
  position_x INTEGER DEFAULT 50,
  position_y INTEGER DEFAULT 50,
  order_index INTEGER DEFAULT 0,
  alt_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on entry_images
ALTER TABLE entry_images ENABLE ROW LEVEL SECURITY;

-- RLS policies for entry_images
CREATE POLICY "Admins and editors can manage entry_images"
ON entry_images FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

CREATE POLICY "Public can view entry_images for published lifelines"
ON entry_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM entries
    JOIN lifelines ON lifelines.id = entries.lifeline_id
    WHERE entries.id = entry_images.entry_id 
    AND lifelines.status = 'published'::content_status
    AND lifelines.visibility = 'public'::visibility_type
  )
);

CREATE POLICY "Viewers can view entry_images"
ON entry_images FOR SELECT
USING (has_role(auth.uid(), 'viewer'::user_role) OR has_role(auth.uid(), 'editor'::user_role) OR has_role(auth.uid(), 'admin'::user_role));

-- Migrate existing data from media_assets
UPDATE collections c
SET 
  hero_image_url = m.url,
  hero_image_path = m.filename
FROM media_assets m
WHERE c.hero_image_id = m.id AND c.hero_image_url IS NULL;

UPDATE lifelines l
SET 
  cover_image_url = m.url,
  cover_image_path = m.filename
FROM media_assets m
WHERE l.cover_image_id = m.id AND l.cover_image_url IS NULL;

UPDATE profiles p
SET 
  avatar_image_url = m.url,
  avatar_image_path = m.filename
FROM media_assets m
WHERE p.avatar_image_id = m.id AND p.avatar_image_url IS NULL;

-- Migrate entry_media to entry_images
INSERT INTO entry_images (entry_id, image_url, image_path, position_x, position_y, order_index, alt_text)
SELECT 
  em.entry_id,
  m.url,
  m.filename,
  m.position_x,
  m.position_y,
  em.order_index,
  m.alt_text
FROM entry_media em
JOIN media_assets m ON em.media_id = m.id
ON CONFLICT DO NOTHING;