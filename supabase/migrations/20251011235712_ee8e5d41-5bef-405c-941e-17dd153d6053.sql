-- Fix search_path for the newly created functions
CREATE OR REPLACE FUNCTION public.calculate_entry_average_score(entry_uuid UUID)
RETURNS NUMERIC 
LANGUAGE SQL 
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(AVG(user_score), 0)
  FROM public.entry_votes
  WHERE entry_id = entry_uuid AND user_score IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.get_entry_vote_count(entry_uuid UUID)
RETURNS INTEGER 
LANGUAGE SQL 
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.entry_votes
  WHERE entry_id = entry_uuid;
$$;