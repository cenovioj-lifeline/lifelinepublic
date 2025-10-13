-- Create user profiles table for public users
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view all profiles
CREATE POLICY "Anyone can view user profiles"
ON public.user_profiles
FOR SELECT
USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can create their own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Create fan contributions table
CREATE TABLE public.fan_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lifeline_id UUID NOT NULL REFERENCES public.lifelines(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  score INTEGER,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_message TEXT,
  entry_id UUID REFERENCES public.entries(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on fan_contributions
ALTER TABLE public.fan_contributions ENABLE ROW LEVEL SECURITY;

-- Users can view their own contributions
CREATE POLICY "Users can view their own contributions"
ON public.fan_contributions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create contributions
CREATE POLICY "Users can create contributions"
ON public.fan_contributions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all contributions
CREATE POLICY "Admins can view all contributions"
ON public.fan_contributions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

-- Admins can update contributions
CREATE POLICY "Admins can update contributions"
ON public.fan_contributions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

-- Add trigger to update updated_at on user_profiles
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add is_fan_contributed column to entries table
ALTER TABLE public.entries
ADD COLUMN is_fan_contributed BOOLEAN DEFAULT false,
ADD COLUMN contributed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;