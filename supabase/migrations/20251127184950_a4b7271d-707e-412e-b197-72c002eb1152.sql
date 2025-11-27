-- Create collection_members table
CREATE TABLE collection_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(user_id, collection_id)
);

-- Enable RLS
ALTER TABLE collection_members ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can join collections" 
  ON collection_members 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave collections" 
  ON collection_members 
  FOR DELETE 
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view member counts" 
  ON collection_members 
  FOR SELECT 
  USING (true);