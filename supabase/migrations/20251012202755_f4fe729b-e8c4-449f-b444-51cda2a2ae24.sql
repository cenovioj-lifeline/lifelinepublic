-- Allow public to view entries for published lifelines
CREATE POLICY "Public can view entries for published lifelines"
  ON entries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lifelines 
      WHERE lifelines.id = entries.lifeline_id 
      AND lifelines.status = 'published'
      AND lifelines.visibility = 'public'
    )
  );

-- Allow public to view election results for published elections
CREATE POLICY "Public can view election results for published elections"
  ON election_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mock_elections 
      WHERE mock_elections.id = election_results.election_id 
      AND mock_elections.status = 'published'
      AND mock_elections.visibility = 'public'
    )
  );

-- Allow public to view ballot items for published elections
CREATE POLICY "Public can view ballot items for published elections"
  ON ballot_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mock_elections 
      WHERE mock_elections.id = ballot_items.election_id 
      AND mock_elections.status = 'published'
      AND mock_elections.visibility = 'public'
    )
  );

-- Allow public to view ballot options for published elections
CREATE POLICY "Public can view ballot options for published elections"
  ON ballot_options
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ballot_items
      JOIN mock_elections ON mock_elections.id = ballot_items.election_id
      WHERE ballot_items.id = ballot_options.ballot_item_id
      AND mock_elections.status = 'published'
      AND mock_elections.visibility = 'public'
    )
  );

-- Allow public to view entry_media for published lifelines
CREATE POLICY "Public can view entry_media for published lifelines"
  ON entry_media
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM entries
      JOIN lifelines ON lifelines.id = entries.lifeline_id
      WHERE entries.id = entry_media.entry_id
      AND lifelines.status = 'published'
      AND lifelines.visibility = 'public'
    )
  );

-- Allow public to view media assets (needed for images in entries, profiles, etc.)
CREATE POLICY "Public can view media assets"
  ON media_assets
  FOR SELECT
  USING (true);