-- Fix Security Definer View issue
-- Drop and recreate the view with SECURITY INVOKER to use the querying user's permissions

DROP VIEW IF EXISTS public_contributors;

-- Recreate view with SECURITY INVOKER (not SECURITY DEFINER)
CREATE OR REPLACE VIEW public_contributors 
WITH (security_invoker=true)
AS
SELECT
  user_id,
  first_name,
  last_name,
  avatar_url
FROM user_profiles;

-- Grant access to the view
GRANT SELECT ON public_contributors TO anon, authenticated;

-- Add comment
COMMENT ON VIEW public_contributors IS 'Safe public view of user profiles showing only contributor names and avatars';