-- Add hide_contribution_button to user_preferences
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS hide_contribution_button boolean DEFAULT false;

-- Add contributor tracking to collection_quotes
ALTER TABLE collection_quotes
ADD COLUMN IF NOT EXISTS contributed_by_user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS contribution_status text DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS admin_message text,
ADD COLUMN IF NOT EXISTS submitted_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id);

-- Add contribution_status to entries
ALTER TABLE entries
ADD COLUMN IF NOT EXISTS contribution_status text DEFAULT 'approved';

-- Update RLS policies for collection_quotes to allow contributors to see their own pending/rejected
DROP POLICY IF EXISTS "Contributors can view their own pending quotes" ON collection_quotes;
CREATE POLICY "Contributors can view their own pending quotes"
ON collection_quotes
FOR SELECT
USING (
  contribution_status IN ('approved', 'auto_approved')
  OR auth.uid() = contributed_by_user_id
);

-- Update RLS policies for entries to allow contributors to see their own pending/rejected
DROP POLICY IF EXISTS "Contributors can view their own pending entries" ON entries;
CREATE POLICY "Contributors can view their own pending entries"
ON entries
FOR SELECT
USING (
  contribution_status IN ('approved', 'auto_approved')
  OR auth.uid() = contributed_by_user_id
);

-- Allow contributors to update their own pending/rejected contributions
DROP POLICY IF EXISTS "Contributors can update their own pending entries" ON entries;
CREATE POLICY "Contributors can update their own pending entries"
ON entries
FOR UPDATE
USING (
  auth.uid() = contributed_by_user_id
  AND contribution_status IN ('pending', 'rejected')
);

-- Allow contributors to delete their own pending/rejected contributions
DROP POLICY IF EXISTS "Contributors can delete their own pending entries" ON entries;
CREATE POLICY "Contributors can delete their own pending entries"
ON entries
FOR DELETE
USING (
  auth.uid() = contributed_by_user_id
  AND contribution_status IN ('pending', 'rejected')
);

-- Allow contributors to update their own pending/rejected quotes
DROP POLICY IF EXISTS "Contributors can update their own pending quotes" ON collection_quotes;
CREATE POLICY "Contributors can update their own pending quotes"
ON collection_quotes
FOR UPDATE
USING (
  auth.uid() = contributed_by_user_id
  AND contribution_status IN ('pending', 'rejected')
);

-- Allow contributors to delete their own pending/rejected quotes
DROP POLICY IF EXISTS "Contributors can delete their own pending quotes" ON collection_quotes;
CREATE POLICY "Contributors can delete their own pending quotes"
ON collection_quotes
FOR DELETE
USING (
  auth.uid() = contributed_by_user_id
  AND contribution_status IN ('pending', 'rejected')
);