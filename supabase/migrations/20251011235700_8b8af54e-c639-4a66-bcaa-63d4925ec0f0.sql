-- Add 'voting' to lifeline_type enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'voting' 
    AND enumtypid = 'lifeline_type'::regtype
  ) THEN
    ALTER TYPE lifeline_type ADD VALUE 'voting';
  END IF;
END $$;

-- Create entry_votes table to store individual user votes
CREATE TABLE IF NOT EXISTS public.entry_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_score INTEGER CHECK (user_score >= 0 AND user_score <= 10),
  user_order INTEGER,
  voted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(entry_id, user_id)
);

-- Enable RLS on entry_votes
ALTER TABLE public.entry_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for entry_votes
CREATE POLICY "Users can view all votes"
  ON public.entry_votes
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own votes"
  ON public.entry_votes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
  ON public.entry_votes
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON public.entry_votes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster vote lookups
CREATE INDEX idx_entry_votes_entry_id ON public.entry_votes(entry_id);
CREATE INDEX idx_entry_votes_user_id ON public.entry_votes(user_id);

-- Create a function to calculate average scores from votes
CREATE OR REPLACE FUNCTION public.calculate_entry_average_score(entry_uuid UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(AVG(user_score), 0)
  FROM public.entry_votes
  WHERE entry_id = entry_uuid AND user_score IS NOT NULL;
$$ LANGUAGE SQL STABLE;

-- Create a function to get vote count for an entry
CREATE OR REPLACE FUNCTION public.get_entry_vote_count(entry_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.entry_votes
  WHERE entry_id = entry_uuid;
$$ LANGUAGE SQL STABLE;