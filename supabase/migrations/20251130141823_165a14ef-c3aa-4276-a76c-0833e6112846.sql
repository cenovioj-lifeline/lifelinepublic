-- Create table to track which feed entries users have seen
CREATE TABLE user_feed_seen (
  user_id UUID NOT NULL,
  entry_id TEXT NOT NULL,
  seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, entry_id)
);

-- Enable RLS
ALTER TABLE user_feed_seen ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own seen entries
CREATE POLICY "Users manage own seen entries" 
ON user_feed_seen
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX idx_user_feed_seen_user_id ON user_feed_seen(user_id);
CREATE INDEX idx_user_feed_seen_entry_id ON user_feed_seen(entry_id);