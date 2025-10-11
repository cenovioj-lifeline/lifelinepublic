-- Enable RLS on junction tables
ALTER TABLE collection_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifeline_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_lifelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_tags ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for collection_tags
CREATE POLICY "Admins and editors can manage collection_tags"
ON collection_tags
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

CREATE POLICY "Viewers can view collection_tags"
ON collection_tags
FOR SELECT
USING (has_role(auth.uid(), 'viewer'::user_role) OR has_role(auth.uid(), 'editor'::user_role) OR has_role(auth.uid(), 'admin'::user_role));

-- Add RLS policies for lifeline_tags
CREATE POLICY "Admins and editors can manage lifeline_tags"
ON lifeline_tags
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

CREATE POLICY "Viewers can view lifeline_tags"
ON lifeline_tags
FOR SELECT
USING (has_role(auth.uid(), 'viewer'::user_role) OR has_role(auth.uid(), 'editor'::user_role) OR has_role(auth.uid(), 'admin'::user_role));

-- Add RLS policies for profile_collections
CREATE POLICY "Admins and editors can manage profile_collections"
ON profile_collections
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

CREATE POLICY "Viewers can view profile_collections"
ON profile_collections
FOR SELECT
USING (has_role(auth.uid(), 'viewer'::user_role) OR has_role(auth.uid(), 'editor'::user_role) OR has_role(auth.uid(), 'admin'::user_role));

-- Add RLS policies for profile_lifelines
CREATE POLICY "Admins and editors can manage profile_lifelines"
ON profile_lifelines
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

CREATE POLICY "Viewers can view profile_lifelines"
ON profile_lifelines
FOR SELECT
USING (has_role(auth.uid(), 'viewer'::user_role) OR has_role(auth.uid(), 'editor'::user_role) OR has_role(auth.uid(), 'admin'::user_role));

-- Add RLS policies for profile_tags
CREATE POLICY "Admins and editors can manage profile_tags"
ON profile_tags
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

CREATE POLICY "Viewers can view profile_tags"
ON profile_tags
FOR SELECT
USING (has_role(auth.uid(), 'viewer'::user_role) OR has_role(auth.uid(), 'editor'::user_role) OR has_role(auth.uid(), 'admin'::user_role));