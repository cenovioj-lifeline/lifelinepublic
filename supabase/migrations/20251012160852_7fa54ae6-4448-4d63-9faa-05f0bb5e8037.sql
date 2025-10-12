-- Create junction table for election tags
CREATE TABLE IF NOT EXISTS public.election_tags (
  election_id uuid NOT NULL REFERENCES public.mock_elections(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (election_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.election_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for election_tags
CREATE POLICY "Viewers can view election_tags"
  ON public.election_tags
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'viewer'::user_role) OR 
    has_role(auth.uid(), 'editor'::user_role) OR 
    has_role(auth.uid(), 'admin'::user_role)
  );

CREATE POLICY "Admins and editors can manage election_tags"
  ON public.election_tags
  FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'editor'::user_role)
  );

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_election_tags_election_id ON public.election_tags(election_id);
CREATE INDEX IF NOT EXISTS idx_election_tags_tag_id ON public.election_tags(tag_id);