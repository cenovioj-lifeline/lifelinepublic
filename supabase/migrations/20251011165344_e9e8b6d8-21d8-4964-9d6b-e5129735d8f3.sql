-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer');
CREATE TYPE content_status AS ENUM ('draft', 'published');
CREATE TYPE lifeline_type AS ENUM ('profile', 'list', 'event');
CREATE TYPE profile_type AS ENUM ('person_real', 'person_fictional', 'entity', 'organization');
CREATE TYPE visibility_type AS ENUM ('public', 'unlisted', 'private');
CREATE TYPE sentiment_type AS ENUM ('positive', 'negative', 'neutral', 'mixed');

-- User roles table (separate from profiles for security)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Media assets table
CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL,
  alt_text TEXT,
  credit TEXT,
  source_url TEXT,
  width INTEGER,
  height INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

-- Tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  category TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Collections table
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  style_notes TEXT,
  hero_image_id UUID REFERENCES media_assets(id),
  is_featured BOOLEAN DEFAULT FALSE,
  status content_status NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type profile_type NOT NULL,
  summary TEXT,
  long_bio TEXT,
  avatar_image_id UUID REFERENCES media_assets(id),
  external_links JSONB DEFAULT '[]',
  demographics JSONB DEFAULT '{}',
  birth_date DATE,
  death_date DATE,
  nationality TEXT,
  occupation TEXT,
  status content_status NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Lifelines table
CREATE TABLE lifelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  subtitle TEXT,
  intro TEXT,
  conclusion TEXT,
  lifeline_type lifeline_type NOT NULL DEFAULT 'profile',
  subject_name TEXT,
  profile_id UUID REFERENCES profiles(id),
  visibility visibility_type NOT NULL DEFAULT 'public',
  status content_status NOT NULL DEFAULT 'draft',
  cover_image_id UUID REFERENCES media_assets(id),
  collection_id UUID REFERENCES collections(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE lifelines ENABLE ROW LEVEL SECURITY;

-- Entries table (inline with lifelines)
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lifeline_id UUID REFERENCES lifelines(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  score INTEGER CHECK (score >= -10 AND score <= 10),
  occurred_on DATE,
  age_at_event INTEGER,
  summary TEXT,
  details TEXT,
  sentiment sentiment_type DEFAULT 'neutral',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Entry media junction table
CREATE TABLE entry_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE NOT NULL,
  media_id UUID REFERENCES media_assets(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE entry_media ENABLE ROW LEVEL SECURITY;

-- Mock elections table
CREATE TABLE mock_elections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  opens_at TIMESTAMPTZ,
  closes_at TIMESTAMPTZ,
  visibility visibility_type NOT NULL DEFAULT 'public',
  status content_status NOT NULL DEFAULT 'draft',
  collection_id UUID REFERENCES collections(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE mock_elections ENABLE ROW LEVEL SECURITY;

-- Ballot items (questions)
CREATE TABLE ballot_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID REFERENCES mock_elections(id) ON DELETE CASCADE NOT NULL,
  prompt TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'single_choice',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE ballot_items ENABLE ROW LEVEL SECURITY;

-- Ballot options (candidates/choices)
CREATE TABLE ballot_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ballot_item_id UUID REFERENCES ballot_items(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  image_id UUID REFERENCES media_assets(id),
  profile_ref UUID REFERENCES profiles(id),
  lifeline_ref UUID REFERENCES lifelines(id),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE ballot_options ENABLE ROW LEVEL SECURITY;

-- Junction tables
CREATE TABLE collection_tags (
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (collection_id, tag_id)
);

CREATE TABLE lifeline_tags (
  lifeline_id UUID REFERENCES lifelines(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (lifeline_id, tag_id)
);

CREATE TABLE profile_tags (
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, tag_id)
);

CREATE TABLE profile_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
  role_in_collection TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, collection_id)
);

CREATE TABLE profile_lifelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  lifeline_id UUID REFERENCES lifelines(id) ON DELETE CASCADE NOT NULL,
  relationship_type TEXT DEFAULT 'related',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, lifeline_id)
);

-- RLS Policies
-- Admin full access
CREATE POLICY "Admins have full access to user_roles"
  ON user_roles FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins and editors can manage media"
  ON media_assets FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Viewers can view media"
  ON media_assets FOR SELECT
  USING (has_role(auth.uid(), 'viewer') OR has_role(auth.uid(), 'editor') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins and editors can manage tags"
  ON tags FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Viewers can view tags"
  ON tags FOR SELECT
  USING (has_role(auth.uid(), 'viewer') OR has_role(auth.uid(), 'editor') OR has_role(auth.uid(), 'admin'));

-- Collections policies
CREATE POLICY "Admins and editors can manage collections"
  ON collections FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Viewers can view collections"
  ON collections FOR SELECT
  USING (has_role(auth.uid(), 'viewer') OR has_role(auth.uid(), 'editor') OR has_role(auth.uid(), 'admin'));

-- Profiles policies
CREATE POLICY "Admins and editors can manage profiles"
  ON profiles FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Viewers can view profiles"
  ON profiles FOR SELECT
  USING (has_role(auth.uid(), 'viewer') OR has_role(auth.uid(), 'editor') OR has_role(auth.uid(), 'admin'));

-- Lifelines policies
CREATE POLICY "Admins and editors can manage lifelines"
  ON lifelines FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Viewers can view lifelines"
  ON lifelines FOR SELECT
  USING (has_role(auth.uid(), 'viewer') OR has_role(auth.uid(), 'editor') OR has_role(auth.uid(), 'admin'));

-- Entries policies
CREATE POLICY "Admins and editors can manage entries"
  ON entries FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Viewers can view entries"
  ON entries FOR SELECT
  USING (has_role(auth.uid(), 'viewer') OR has_role(auth.uid(), 'editor') OR has_role(auth.uid(), 'admin'));

-- Entry media policies
CREATE POLICY "Admins and editors can manage entry_media"
  ON entry_media FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Viewers can view entry_media"
  ON entry_media FOR SELECT
  USING (has_role(auth.uid(), 'viewer') OR has_role(auth.uid(), 'editor') OR has_role(auth.uid(), 'admin'));

-- Mock elections policies
CREATE POLICY "Admins and editors can manage elections"
  ON mock_elections FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Viewers can view elections"
  ON mock_elections FOR SELECT
  USING (has_role(auth.uid(), 'viewer') OR has_role(auth.uid(), 'editor') OR has_role(auth.uid(), 'admin'));

-- Ballot items policies
CREATE POLICY "Admins and editors can manage ballot_items"
  ON ballot_items FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Viewers can view ballot_items"
  ON ballot_items FOR SELECT
  USING (has_role(auth.uid(), 'viewer') OR has_role(auth.uid(), 'editor') OR has_role(auth.uid(), 'admin'));

-- Ballot options policies
CREATE POLICY "Admins and editors can manage ballot_options"
  ON ballot_options FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Viewers can view ballot_options"
  ON ballot_options FOR SELECT
  USING (has_role(auth.uid(), 'viewer') OR has_role(auth.uid(), 'editor') OR has_role(auth.uid(), 'admin'));

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_media_assets_updated_at BEFORE UPDATE ON media_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lifelines_updated_at BEFORE UPDATE ON lifelines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entries_updated_at BEFORE UPDATE ON entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mock_elections_updated_at BEFORE UPDATE ON mock_elections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ballot_items_updated_at BEFORE UPDATE ON ballot_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();