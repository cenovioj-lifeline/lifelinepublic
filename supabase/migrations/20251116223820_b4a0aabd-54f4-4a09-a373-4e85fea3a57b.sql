-- Drop existing SELECT policies on fan_contributions
DROP POLICY IF EXISTS "Admins can view all contributions" ON public.fan_contributions;
DROP POLICY IF EXISTS "Users can view their own contributions" ON public.fan_contributions;

-- Recreate SELECT policies with proper restrictions
-- Admins and editors can view all contributions
CREATE POLICY "Admins and editors can view all contributions"
ON public.fan_contributions
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'editor'::user_role)
);

-- Users can ONLY view their own contributions
CREATE POLICY "Users can view only their own contributions"
ON public.fan_contributions
FOR SELECT
USING (auth.uid() = user_id);