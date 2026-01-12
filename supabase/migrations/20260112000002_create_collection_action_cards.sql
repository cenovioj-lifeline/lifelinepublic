-- Collection Action Cards
-- Per-collection assignments of action cards with custom ordering and labels

CREATE TABLE IF NOT EXISTS collection_action_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  action_card_id uuid NOT NULL REFERENCES action_cards(id) ON DELETE CASCADE,

  -- Configuration
  display_order integer NOT NULL DEFAULT 0,
  label_override text,
  is_enabled boolean DEFAULT true,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Constraints
  UNIQUE(collection_id, action_card_id)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_cac_collection
  ON collection_action_cards(collection_id)
  WHERE is_enabled = true;

-- Enable RLS
ALTER TABLE collection_action_cards ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read enabled collection action cards
CREATE POLICY "Anyone can read collection action cards"
  ON collection_action_cards FOR SELECT
  USING (is_enabled = true);

-- Policy: Authenticated users can manage collection action cards
CREATE POLICY "Authenticated users can manage collection action cards"
  ON collection_action_cards FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE collection_action_cards IS 'Per-collection action card assignments with custom ordering and labels';
