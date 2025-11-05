-- Clean slate: Drop existing profiles structures
DROP TABLE IF EXISTS profile_tags CASCADE;
DROP TABLE IF EXISTS profile_collections CASCADE;
DROP TABLE IF EXISTS profile_lifelines CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create new modular profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- TIER 1: Universal Core (always present)
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  subject_type TEXT NOT NULL CHECK (subject_type IN ('Person', 'Fictional Character', 'Organization', 'Concept', 'Place', 'Event')),
  reality_status TEXT NOT NULL CHECK (reality_status IN ('Real', 'Fictional', 'Mythological', 'Disputed/Legendary')),
  
  -- References (can be empty)
  primary_lifeline_id UUID REFERENCES lifelines(id) ON DELETE SET NULL,
  primary_collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  
  -- Core text fields
  short_description TEXT NOT NULL,
  known_for TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  
  -- Image handling
  primary_image_url TEXT,
  primary_image_path TEXT,
  avatar_image_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  
  -- Status
  status content_status NOT NULL DEFAULT 'draft',
  
  -- TIER 2 & 3: All modular/optional data stored as JSONB
  extended_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_profiles_subject_type ON profiles(subject_type);
CREATE INDEX idx_profiles_reality_status ON profiles(reality_status);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_primary_collection ON profiles(primary_collection_id);
CREATE INDEX idx_profiles_extended_data ON profiles USING GIN (extended_data);

-- Related profiles junction table (for related_profiles in Tier 1)
CREATE TABLE public.profile_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  related_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_profile_relationships_profile ON profile_relationships(profile_id);
CREATE INDEX idx_profile_relationships_related ON profile_relationships(related_profile_id);

-- Junction table: Profiles to Collections (many-to-many)
CREATE TABLE public.profile_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  is_featured BOOLEAN DEFAULT false,
  role_in_collection TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, collection_id)
);

CREATE INDEX idx_profile_collections_profile ON profile_collections(profile_id);
CREATE INDEX idx_profile_collections_collection ON profile_collections(collection_id);

-- Junction table: Profiles to Lifelines (many-to-many)
CREATE TABLE public.profile_lifelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lifeline_id UUID NOT NULL REFERENCES lifelines(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'related',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, lifeline_id)
);

CREATE INDEX idx_profile_lifelines_profile ON profile_lifelines(profile_id);
CREATE INDEX idx_profile_lifelines_lifeline ON profile_lifelines(lifeline_id);

-- Junction table: Profiles to Tags
CREATE TABLE public.profile_tags (
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, tag_id)
);

CREATE INDEX idx_profile_tags_profile ON profile_tags(profile_id);
CREATE INDEX idx_profile_tags_tag ON profile_tags(tag_id);

-- Trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published profiles"
  ON profiles FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins and editors can manage profiles"
  ON profiles FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Viewers can view profiles"
  ON profiles FOR SELECT
  USING (has_role(auth.uid(), 'viewer') OR has_role(auth.uid(), 'editor') OR has_role(auth.uid(), 'admin'));

-- RLS for junction tables
ALTER TABLE profile_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_lifelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view profile_relationships"
  ON profile_relationships FOR SELECT
  USING (true);

CREATE POLICY "Admins and editors can manage profile_relationships"
  ON profile_relationships FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Public can view profile_collections"
  ON profile_collections FOR SELECT
  USING (true);

CREATE POLICY "Admins and editors can manage profile_collections"
  ON profile_collections FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Public can view profile_lifelines"
  ON profile_lifelines FOR SELECT
  USING (true);

CREATE POLICY "Admins and editors can manage profile_lifelines"
  ON profile_lifelines FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Public can view profile_tags"
  ON profile_tags FOR SELECT
  USING (true);

CREATE POLICY "Admins and editors can manage profile_tags"
  ON profile_tags FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));