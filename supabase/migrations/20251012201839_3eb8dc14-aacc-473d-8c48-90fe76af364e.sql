-- Allow public to view published profiles
CREATE POLICY "Public can view published profiles"
  ON profiles
  FOR SELECT
  USING (status = 'published');

-- Allow public to view published lifelines  
CREATE POLICY "Public can view published lifelines"
  ON lifelines
  FOR SELECT
  USING (status = 'published');

-- Allow public to view published elections
CREATE POLICY "Public can view published elections"
  ON mock_elections
  FOR SELECT
  USING (status = 'published');

-- Allow public to view profile_collections (junction table)
CREATE POLICY "Public can view profile_collections"
  ON profile_collections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = profile_collections.profile_id 
      AND profiles.status = 'published'
    )
  );