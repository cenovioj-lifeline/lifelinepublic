-- Drop the public SELECT policy on user_profiles
DROP POLICY IF EXISTS "Public can view contributor names" ON public.user_profiles;

-- Ensure the public_contributors view has proper access
-- The view should already exist and only expose necessary fields for contributors
GRANT SELECT ON public.public_contributors TO anon, authenticated;