-- Add 'public_user' role to the existing user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'public_user';

-- Update the handle_new_user trigger to assign 'public_user' role by default
-- This allows public signups while admins must be manually promoted
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'public_user');
  RETURN NEW;
END;
$function$;