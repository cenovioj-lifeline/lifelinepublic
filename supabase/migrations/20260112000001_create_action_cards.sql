-- Action Cards System
-- Global library of action cards that can be assigned to collections

CREATE TABLE IF NOT EXISTS action_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,

  -- Visual
  icon_name text,
  icon_url text,

  -- Implementation Status
  is_implemented boolean DEFAULT false,
  implementation_notes text,

  -- Default Behavior
  is_default boolean DEFAULT false,
  default_order integer DEFAULT 0,

  -- Status
  status text DEFAULT 'active',

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE action_cards ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active action cards
CREATE POLICY "Anyone can read active action cards"
  ON action_cards FOR SELECT
  USING (status = 'active');

-- Policy: Authenticated users can manage action cards (admin)
CREATE POLICY "Authenticated users can manage action cards"
  ON action_cards FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE action_cards IS 'Global library of action cards for collection pages';

-- Seed with current 4 default cards (matching existing hardcoded behavior)
INSERT INTO action_cards (name, slug, icon_name, is_implemented, is_default, default_order, description, status) VALUES
('Feed', 'feed', 'Rss', false, true, 1, 'Activity feed - not yet implemented', 'active'),
('Share', 'share', 'Share2', true, true, 2, 'Opens share modal', 'active'),
('Members', 'members', 'Users', true, true, 3, 'Opens join/members dialog', 'active'),
('Settings', 'settings', 'Settings', true, true, 4, 'Navigates to collection settings', 'active');
