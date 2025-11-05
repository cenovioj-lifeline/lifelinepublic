-- Add subject_status field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subject_status TEXT;

-- Create profile_works table for notable works and media appearances
CREATE TABLE IF NOT EXISTS profile_works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  work_category TEXT NOT NULL CHECK (work_category IN ('notable_work', 'media_appearance')),
  title TEXT NOT NULL,
  year TEXT,
  work_type TEXT,
  significance TEXT,
  additional_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on profile_works
ALTER TABLE profile_works ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profile_works
CREATE POLICY "Admins and editors can manage profile_works"
ON profile_works
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

CREATE POLICY "Public can view profile_works"
ON profile_works
FOR SELECT
USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profile_works_profile_id ON profile_works(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_works_category ON profile_works(work_category);

-- Add updated_at trigger
CREATE TRIGGER update_profile_works_updated_at
  BEFORE UPDATE ON profile_works
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();