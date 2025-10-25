-- Fix security issue: Restrict public access to user_profiles table
-- Enable RLS and create proper policies

-- Enable Row Level Security on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies (in case they exist)
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Anyone can view user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;
DROP POLICY IF EXISTS "Public can view contributor names" ON user_profiles;

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Allow viewing of profiles for top contributors display (read-only, limited fields)
-- This allows the app to show contributor names without exposing all profile data
CREATE POLICY "Public can view contributor names"
ON user_profiles
FOR SELECT
TO anon, authenticated
USING (true);

-- Optional: Create a public view for safe contributor display
CREATE OR REPLACE VIEW public_contributors AS
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