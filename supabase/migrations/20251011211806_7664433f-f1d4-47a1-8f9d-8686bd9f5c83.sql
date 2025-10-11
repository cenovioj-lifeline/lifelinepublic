-- Create election_results table to store winners by category
CREATE TABLE election_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID NOT NULL REFERENCES mock_elections(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  winner_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  vote_count INTEGER,
  percentage NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE election_results ENABLE ROW LEVEL SECURITY;

-- Policies for election_results
CREATE POLICY "Admins and editors can manage election_results"
  ON election_results
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

CREATE POLICY "Viewers can view election_results"
  ON election_results
  FOR SELECT
  USING (
    has_role(auth.uid(), 'viewer'::user_role) OR 
    has_role(auth.uid(), 'editor'::user_role) OR 
    has_role(auth.uid(), 'admin'::user_role)
  );

-- Add trigger for updated_at
CREATE TRIGGER update_election_results_updated_at
  BEFORE UPDATE ON election_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();