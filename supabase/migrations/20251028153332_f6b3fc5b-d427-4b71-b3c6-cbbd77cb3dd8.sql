-- Function to toggle super_fan role for a user
CREATE OR REPLACE FUNCTION public.toggle_super_fan(target_user_id UUID, is_super_fan BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF is_super_fan THEN
    -- Add super_fan role if it doesn't exist
    INSERT INTO user_roles (user_id, role)
    VALUES (target_user_id, 'super_fan')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Remove super_fan role
    DELETE FROM user_roles
    WHERE user_id = target_user_id AND role = 'super_fan';
  END IF;
END;
$$;

-- Function to check if user is a super fan
CREATE OR REPLACE FUNCTION public.is_super_fan(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = check_user_id AND role = 'super_fan'
  );
$$;