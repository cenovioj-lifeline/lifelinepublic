-- Create entities table for entity registry
CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id TEXT UNIQUE NOT NULL,
    entity_type TEXT NOT NULL,
    primary_name TEXT NOT NULL,
    alternate_names TEXT[] DEFAULT ARRAY[]::TEXT[],
    canonical_slug TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_entities_entity_id ON entities(entity_id);
CREATE INDEX idx_entities_entity_type ON entities(entity_type);
CREATE INDEX idx_entities_canonical_slug ON entities(canonical_slug);

-- Create entity_appearances table for tracking where entities appear
CREATE TABLE entity_appearances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id TEXT NOT NULL REFERENCES entities(entity_id) ON DELETE CASCADE,
    appearance_type TEXT NOT NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    lifeline_id UUID REFERENCES lifelines(id) ON DELETE CASCADE,
    entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT entity_appearances_reference_check CHECK (
        (appearance_type = 'profile' AND profile_id IS NOT NULL) OR
        (appearance_type = 'lifeline' AND lifeline_id IS NOT NULL) OR
        (appearance_type = 'entry' AND entry_id IS NOT NULL) OR
        (appearance_type = 'collection' AND collection_id IS NOT NULL)
    )
);

CREATE INDEX idx_entity_appearances_entity_id ON entity_appearances(entity_id);
CREATE INDEX idx_entity_appearances_profile_id ON entity_appearances(profile_id);
CREATE INDEX idx_entity_appearances_lifeline_id ON entity_appearances(lifeline_id);
CREATE INDEX idx_entity_appearances_entry_id ON entity_appearances(entry_id);
CREATE INDEX idx_entity_appearances_collection_id ON entity_appearances(collection_id);
CREATE INDEX idx_entity_appearances_type ON entity_appearances(appearance_type);

-- Create or replace trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to entities table
CREATE TRIGGER entities_updated_at
    BEFORE UPDATE ON entities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create entity_registry view
CREATE VIEW entity_registry AS
SELECT 
    e.entity_id,
    e.entity_type,
    e.primary_name,
    e.alternate_names,
    e.canonical_slug,
    e.metadata,
    array_agg(
        json_build_object(
            'appearance_type', ea.appearance_type,
            'profile_id', ea.profile_id,
            'lifeline_id', ea.lifeline_id,
            'entry_id', ea.entry_id,
            'collection_id', ea.collection_id
        )
    ) FILTER (WHERE ea.id IS NOT NULL) as appearances
FROM entities e
LEFT JOIN entity_appearances ea ON e.entity_id = ea.entity_id
GROUP BY e.entity_id, e.entity_type, e.primary_name, 
         e.alternate_names, e.canonical_slug, e.metadata;

-- Enable RLS on both tables
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_appearances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for entities table
CREATE POLICY "Admins and editors can manage entities"
  ON entities
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

CREATE POLICY "Viewers can view entities"
  ON entities
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'viewer'::user_role) OR has_role(auth.uid(), 'editor'::user_role) OR has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Public can view entities"
  ON entities
  FOR SELECT
  TO anon
  USING (true);

-- RLS Policies for entity_appearances table
CREATE POLICY "Admins and editors can manage entity_appearances"
  ON entity_appearances
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

CREATE POLICY "Viewers can view entity_appearances"
  ON entity_appearances
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'viewer'::user_role) OR has_role(auth.uid(), 'editor'::user_role) OR has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Public can view entity_appearances"
  ON entity_appearances
  FOR SELECT
  TO anon
  USING (true);