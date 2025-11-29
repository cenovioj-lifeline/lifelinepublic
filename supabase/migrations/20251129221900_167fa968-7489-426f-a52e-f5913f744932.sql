-- Create user_feed_subscriptions table
CREATE TABLE user_feed_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lifeline_id uuid NOT NULL REFERENCES lifelines(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lifeline_id)
);

-- Enable RLS
ALTER TABLE user_feed_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own subscriptions"
  ON user_feed_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add subscriptions"
  ON user_feed_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove subscriptions"
  ON user_feed_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_user_feed_subscriptions_user_id ON user_feed_subscriptions(user_id);
CREATE INDEX idx_entries_occurred_on ON entries(occurred_on) WHERE occurred_on IS NOT NULL;