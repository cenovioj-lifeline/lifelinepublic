-- Fix search_path for remaining functions
CREATE OR REPLACE FUNCTION public.calculate_entry_average_score(entry_uuid uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $function$
  SELECT COALESCE(AVG(user_score), 0)
  FROM public.entry_votes
  WHERE entry_id = entry_uuid AND user_score IS NOT NULL;
$function$;

CREATE OR REPLACE FUNCTION public.get_entry_vote_count(entry_uuid uuid)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.entry_votes
  WHERE entry_id = entry_uuid;
$function$;