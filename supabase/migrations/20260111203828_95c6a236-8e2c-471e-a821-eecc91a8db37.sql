-- Fix infinite recursion in collection_roles SELECT policy
-- The current policy references itself, causing infinite recursion

-- Drop the broken policy
DROP POLICY IF EXISTS "Users can view their collection roles" ON collection_roles;

-- Create fixed policy - users can only see their own roles (simple and safe)
CREATE POLICY "Users can view their own collection roles" ON collection_roles
  FOR SELECT USING (user_id = auth.uid());