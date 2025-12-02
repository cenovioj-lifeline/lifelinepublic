-- ============================================
-- LIFELINE PROJECT - COMPLETE DATABASE SCHEMA
-- Generated: 2024-12-02
-- ============================================

-- ENUMS (must be created first)
-- Note: These are already defined in Supabase
-- CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
-- CREATE TYPE lifeline_type AS ENUM ('person', 'list');
-- CREATE TYPE sentiment_type AS ENUM ('positive', 'negative', 'neutral');
-- CREATE TYPE visibility_type AS ENUM ('public', 'private', 'unlisted');
-- CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer', 'public_user', 'super_fan');

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE public.ballot_items (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  election_id uuid NOT NULL,
  prompt text NOT NULL,
  type text NOT NULL DEFAULT 'single_choice'::text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.ballot_options (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  ballot_item_id uuid NOT NULL,
  label text NOT NULL,
  description text,
  image_id uuid,
  profile_ref uuid,
  lifeline_ref uuid,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.collection_custom_section_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL,
  item_id uuid NOT NULL,
  item_type text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.collection_featured_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL,
  item_id uuid NOT NULL,
  item_type text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.collection_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  collection_id uuid NOT NULL,
  joined_at timestamp with time zone DEFAULT now(),
  hidden_from_list boolean NOT NULL DEFAULT false
);

CREATE TABLE public.collection_quotes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL,
  quote text NOT NULL,
  author text,
  context text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  author_profile_id uuid,
  author_profile_ids uuid[],
  contributed_by_user_id uuid,
  contribution_status text DEFAULT 'approved'::text,
  admin_message text,
  submitted_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid
);

CREATE TABLE public.collection_tags (
  collection_id uuid NOT NULL,
  tag_id uuid NOT NULL
);

CREATE TABLE public.collections (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  category text,
  primary_color text,
  secondary_color text,
  style_notes text,
  hero_image_id uuid,
  is_featured boolean DEFAULT false,
  status content_status NOT NULL DEFAULT 'draft'::content_status,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  web_primary text,
  web_secondary text,
  quotes_enabled boolean DEFAULT true,
  quote_frequency integer DEFAULT 1,
  menu_text_color text,
  menu_hover_color text,
  menu_active_color text,
  collection_bg_color text,
  collection_text_color text,
  collection_heading_color text,
  collection_accent_color text,
  collection_card_bg text,
  collection_border_color text,
  collection_muted_text text,
  collection_badge_color text,
  hero_image_position_x integer DEFAULT 50,
  hero_image_position_y integer DEFAULT 50,
  card_image_position_x integer DEFAULT 50,
  card_image_position_y integer DEFAULT 50,
  hero_image_url text,
  hero_image_path text,
  color_scheme_id uuid,
  nav_button_color text,
  banner_text_color text,
  actions_bg_color text,
  actions_border_color text,
  actions_icon_color text,
  actions_text_color text,
  card_text_color text,
  lifeline_display_border text,
  lifeline_display_bg text,
  lifeline_display_title_text text,
  graph_bg_color text,
  graph_line_color text,
  graph_highlight_color text,
  entry_header_bg text,
  entry_header_text text,
  entry_button_color text,
  entry_title_text text,
  entry_contributor_button text,
  entry_bg_color text,
  award_heading_text text,
  award_heading_icon text,
  award_heading_tag text,
  award_icon_color text,
  award_title_text text,
  award_bg_color text,
  award_border_color text,
  profile_header_bg text,
  profile_header_text text,
  profile_card_bg text,
  profile_card_border text,
  default_color text,
  link_color text,
  link_hover_color text,
  custom_section_name text DEFAULT 'New Content'::text
);

CREATE TABLE public.color_schemes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_default boolean DEFAULT false,
  nav_bg_color text NOT NULL DEFAULT '#000000'::text,
  nav_text_color text NOT NULL DEFAULT '#FFFFFF'::text,
  nav_button_color text NOT NULL DEFAULT '#FFFFFF'::text,
  ll_display_bg text NOT NULL DEFAULT '#FFFFFF'::text,
  ll_display_title_text text NOT NULL DEFAULT '#000000'::text,
  ll_graph_positive text NOT NULL DEFAULT '#22C55E'::text,
  ll_graph_negative text NOT NULL DEFAULT '#EF4444'::text,
  ll_entry_contributor_button text NOT NULL DEFAULT '#8B5CF6'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  ll_entry_title_text text DEFAULT '#000000'::text,
  ll_graph_bg text DEFAULT '#FFFFFF'::text,
  ch_banner_text text DEFAULT '#FFFFFF'::text,
  ch_actions_bg text DEFAULT '#F5F5F5'::text,
  ch_actions_border text DEFAULT '#E0E0E0'::text,
  ch_actions_icon text DEFAULT '#333333'::text,
  ch_actions_text text DEFAULT '#333333'::text,
  cards_bg text DEFAULT '#FFFFFF'::text,
  cards_border text DEFAULT '#E0E0E0'::text,
  cards_text text DEFAULT '#333333'::text,
  title_text text DEFAULT '#000000'::text,
  award_bg text DEFAULT '#FFFFFF'::text,
  award_border text DEFAULT '#E0E0E0'::text
);

CREATE TABLE public.election_category_order (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category text NOT NULL,
  display_order integer NOT NULL DEFAULT -1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.election_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  election_id uuid NOT NULL,
  category text NOT NULL,
  winner_profile_id uuid,
  vote_count integer,
  percentage numeric,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  superlative_category text,
  winner_name text,
  media_ids uuid[] DEFAULT '{}'::uuid[],
  winner_profile_ids uuid[] DEFAULT '{}'::uuid[]
);

CREATE TABLE public.election_tags (
  election_id uuid NOT NULL,
  tag_id uuid NOT NULL
);

CREATE TABLE public.entities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  entity_id text NOT NULL,
  entity_type text NOT NULL,
  primary_name text NOT NULL,
  alternate_names text[] DEFAULT ARRAY[]::text[],
  canonical_slug text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.entity_appearances (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  entity_id text NOT NULL,
  appearance_type text NOT NULL,
  profile_id uuid,
  lifeline_id uuid,
  entry_id uuid,
  collection_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  quote_id uuid
);

-- Note: entity_registry is a VIEW, not a table
CREATE VIEW public.entity_registry AS
SELECT 
  entity_id,
  entity_type,
  primary_name,
  alternate_names,
  canonical_slug,
  metadata,
  -- appearances aggregated from entity_appearances
  NULL::json[] as appearances
FROM public.entities;

CREATE TABLE public.entries (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  lifeline_id uuid NOT NULL,
  title text NOT NULL,
  score integer,
  occurred_on date,
  age_at_event integer,
  summary text,
  details text,
  sentiment sentiment_type DEFAULT 'neutral'::sentiment_type,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  collection_id uuid,
  tags text,
  related_lifelines text,
  media_suggestion text,
  is_fan_contributed boolean DEFAULT false,
  contributed_by_user_id uuid,
  serpapi_query text,
  contribution_status text DEFAULT 'approved'::text,
  sequence_label text
);

CREATE TABLE public.entry_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL,
  image_url text NOT NULL,
  image_path text NOT NULL,
  position_x integer DEFAULT 50,
  position_y integer DEFAULT 50,
  order_index integer DEFAULT 0,
  alt_text text,
  created_at timestamp with time zone DEFAULT now(),
  locked boolean NOT NULL DEFAULT false
);

CREATE TABLE public.entry_media (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  entry_id uuid NOT NULL,
  media_id uuid NOT NULL,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  locked boolean NOT NULL DEFAULT false
);

CREATE TABLE public.entry_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL,
  user_id uuid NOT NULL,
  user_score integer,
  user_order integer,
  voted_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.fan_contributions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lifeline_id uuid NOT NULL,
  title text,
  score integer,
  description text,
  status text NOT NULL DEFAULT 'pending'::text,
  admin_message text,
  entry_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  contribution_type text NOT NULL DEFAULT 'event'::text,
  media_id uuid,
  entry_ref uuid,
  quote_text text,
  quote_author text,
  quote_context text,
  quote_author_profile_id uuid
);

CREATE TABLE public.home_page_featured_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.home_page_new_content_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.home_page_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hero_image_id uuid,
  hero_title text,
  hero_subtitle text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  hero_image_position_x integer DEFAULT 50,
  hero_image_position_y integer DEFAULT 50,
  custom_section_name text DEFAULT 'New Content'::text
);

CREATE TABLE public.lifeline_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  setting_key text NOT NULL,
  setting_value text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.lifeline_tags (
  lifeline_id uuid NOT NULL,
  tag_id uuid NOT NULL
);

CREATE TABLE public.lifelines (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  title text NOT NULL,
  slug text NOT NULL,
  subtitle text,
  intro text,
  conclusion text,
  lifeline_type lifeline_type NOT NULL DEFAULT 'person'::lifeline_type,
  profile_id uuid,
  visibility visibility_type NOT NULL DEFAULT 'public'::visibility_type,
  status content_status NOT NULL DEFAULT 'draft'::content_status,
  cover_image_id uuid,
  collection_id uuid,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  subject text,
  is_featured boolean DEFAULT false,
  cover_image_position_x integer DEFAULT 50,
  cover_image_position_y integer DEFAULT 50,
  cover_image_url text,
  cover_image_path text,
  entity_id text,
  serpapi_query text
);

CREATE TABLE public.media_assets (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  filename text NOT NULL,
  url text NOT NULL,
  type text NOT NULL,
  alt_text text,
  credit text,
  source_url text,
  width integer,
  height integer,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  collection_tags text[] DEFAULT '{}'::text[],
  position_x integer DEFAULT 50,
  position_y integer DEFAULT 50,
  scale numeric DEFAULT 1.0
);

CREATE TABLE public.mock_elections (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  opens_at timestamp with time zone,
  closes_at timestamp with time zone,
  visibility visibility_type NOT NULL DEFAULT 'public'::visibility_type,
  status content_status NOT NULL DEFAULT 'draft'::content_status,
  collection_id uuid,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  hero_image_url text,
  hero_image_path text,
  hero_image_position_x integer DEFAULT 50,
  hero_image_position_y integer DEFAULT 50
);

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  related_id uuid,
  related_type text
);

CREATE TABLE public.profile_collections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  collection_id uuid NOT NULL,
  is_featured boolean DEFAULT false,
  role_in_collection text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.profile_lifelines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  lifeline_id uuid NOT NULL,
  relationship_type text DEFAULT 'related'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.profile_relationships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  related_profile_id uuid,
  relationship_type text NOT NULL,
  context text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  target_name text
);

CREATE TABLE public.profile_tags (
  profile_id uuid NOT NULL,
  tag_id uuid NOT NULL
);

CREATE TABLE public.profile_works (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  work_category text NOT NULL,
  title text NOT NULL,
  year text,
  work_type text,
  significance text,
  additional_info jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  subject_type text NOT NULL,
  reality_status text NOT NULL,
  primary_lifeline_id uuid,
  primary_collection_id uuid,
  short_description text NOT NULL,
  known_for text[] NOT NULL DEFAULT '{}'::text[],
  tags text[] NOT NULL DEFAULT '{}'::text[],
  primary_image_url text,
  primary_image_path text,
  avatar_image_id uuid,
  status content_status NOT NULL DEFAULT 'draft'::content_status,
  extended_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  subject_status text,
  entity_id text,
  image_query text
);

-- Note: public_contributors is a VIEW
CREATE VIEW public.public_contributors AS
SELECT 
  up.user_id,
  up.first_name,
  up.last_name,
  up.avatar_url
FROM public.user_profiles up;

CREATE TABLE public.tags (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL,
  category text,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.user_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.user_feed_seen (
  user_id uuid NOT NULL,
  entry_id text NOT NULL,
  seen_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.user_feed_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lifeline_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  hide_person_lifeline_disclaimer boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  hide_contribution_button boolean DEFAULT false
);

CREATE TABLE public.user_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  first_name text,
  last_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.user_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  request_type text NOT NULL DEFAULT 'lifeline_collection'::text,
  request_details text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer'::user_role,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ============================================
-- PRIMARY KEYS
-- ============================================

ALTER TABLE public.ballot_items ADD PRIMARY KEY (id);
ALTER TABLE public.ballot_options ADD PRIMARY KEY (id);
ALTER TABLE public.collection_custom_section_items ADD PRIMARY KEY (id);
ALTER TABLE public.collection_featured_items ADD PRIMARY KEY (id);
ALTER TABLE public.collection_members ADD PRIMARY KEY (id);
ALTER TABLE public.collection_quotes ADD PRIMARY KEY (id);
ALTER TABLE public.collection_tags ADD PRIMARY KEY (collection_id, tag_id);
ALTER TABLE public.collections ADD PRIMARY KEY (id);
ALTER TABLE public.color_schemes ADD PRIMARY KEY (id);
ALTER TABLE public.election_category_order ADD PRIMARY KEY (id);
ALTER TABLE public.election_results ADD PRIMARY KEY (id);
ALTER TABLE public.election_tags ADD PRIMARY KEY (election_id, tag_id);
ALTER TABLE public.entities ADD PRIMARY KEY (id);
ALTER TABLE public.entity_appearances ADD PRIMARY KEY (id);
ALTER TABLE public.entries ADD PRIMARY KEY (id);
ALTER TABLE public.entry_images ADD PRIMARY KEY (id);
ALTER TABLE public.entry_media ADD PRIMARY KEY (id);
ALTER TABLE public.entry_votes ADD PRIMARY KEY (id);
ALTER TABLE public.fan_contributions ADD PRIMARY KEY (id);
ALTER TABLE public.home_page_featured_items ADD PRIMARY KEY (id);
ALTER TABLE public.home_page_new_content_items ADD PRIMARY KEY (id);
ALTER TABLE public.home_page_settings ADD PRIMARY KEY (id);
ALTER TABLE public.lifeline_settings ADD PRIMARY KEY (id);
ALTER TABLE public.lifeline_tags ADD PRIMARY KEY (lifeline_id, tag_id);
ALTER TABLE public.lifelines ADD PRIMARY KEY (id);
ALTER TABLE public.media_assets ADD PRIMARY KEY (id);
ALTER TABLE public.mock_elections ADD PRIMARY KEY (id);
ALTER TABLE public.notifications ADD PRIMARY KEY (id);
ALTER TABLE public.profile_collections ADD PRIMARY KEY (id);
ALTER TABLE public.profile_lifelines ADD PRIMARY KEY (id);
ALTER TABLE public.profile_relationships ADD PRIMARY KEY (id);
ALTER TABLE public.profile_tags ADD PRIMARY KEY (profile_id, tag_id);
ALTER TABLE public.profile_works ADD PRIMARY KEY (id);
ALTER TABLE public.profiles ADD PRIMARY KEY (id);
ALTER TABLE public.tags ADD PRIMARY KEY (id);
ALTER TABLE public.user_favorites ADD PRIMARY KEY (id);
ALTER TABLE public.user_feed_seen ADD PRIMARY KEY (user_id, entry_id);
ALTER TABLE public.user_feed_subscriptions ADD PRIMARY KEY (id);
ALTER TABLE public.user_preferences ADD PRIMARY KEY (id);
ALTER TABLE public.user_profiles ADD PRIMARY KEY (id);
ALTER TABLE public.user_requests ADD PRIMARY KEY (id);
ALTER TABLE public.user_roles ADD PRIMARY KEY (id);

-- ============================================
-- UNIQUE CONSTRAINTS
-- ============================================

ALTER TABLE public.collections ADD CONSTRAINT collections_slug_key UNIQUE (slug);
ALTER TABLE public.election_category_order ADD CONSTRAINT election_category_order_category_key UNIQUE (category);
ALTER TABLE public.entities ADD CONSTRAINT entities_entity_id_key UNIQUE (entity_id);
ALTER TABLE public.entry_votes ADD CONSTRAINT entry_votes_entry_id_user_id_key UNIQUE (entry_id, user_id);
ALTER TABLE public.lifeline_settings ADD CONSTRAINT lifeline_settings_setting_key_key UNIQUE (setting_key);
ALTER TABLE public.lifelines ADD CONSTRAINT lifelines_slug_key UNIQUE (slug);
ALTER TABLE public.mock_elections ADD CONSTRAINT mock_elections_slug_key UNIQUE (slug);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_slug_key UNIQUE (slug);
ALTER TABLE public.tags ADD CONSTRAINT tags_name_key UNIQUE (name);
ALTER TABLE public.tags ADD CONSTRAINT tags_slug_key UNIQUE (slug);
ALTER TABLE public.user_favorites ADD CONSTRAINT user_favorites_user_id_item_type_item_id_key UNIQUE (user_id, item_type, item_id);
ALTER TABLE public.user_feed_subscriptions ADD CONSTRAINT user_feed_subscriptions_user_id_lifeline_id_key UNIQUE (user_id, lifeline_id);
ALTER TABLE public.user_preferences ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
ALTER TABLE public.collection_members ADD CONSTRAINT collection_members_user_id_collection_id_key UNIQUE (user_id, collection_id);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_collection_quotes_author_profile_id ON public.collection_quotes USING btree (author_profile_id);
CREATE INDEX idx_election_category_order_category ON public.election_category_order USING btree (category);
CREATE INDEX idx_election_category_order_display_order ON public.election_category_order USING btree (display_order);
CREATE INDEX idx_election_tags_election_id ON public.election_tags USING btree (election_id);
CREATE INDEX idx_election_tags_tag_id ON public.election_tags USING btree (tag_id);
CREATE INDEX idx_entities_canonical_slug ON public.entities USING btree (canonical_slug);
CREATE INDEX idx_entities_entity_id ON public.entities USING btree (entity_id);
CREATE INDEX idx_entities_entity_type ON public.entities USING btree (entity_type);
CREATE INDEX idx_entity_appearances_collection_id ON public.entity_appearances USING btree (collection_id);
CREATE INDEX idx_entity_appearances_entity_id ON public.entity_appearances USING btree (entity_id);
CREATE INDEX idx_entity_appearances_entry_id ON public.entity_appearances USING btree (entry_id);
CREATE INDEX idx_entity_appearances_lifeline_id ON public.entity_appearances USING btree (lifeline_id);
CREATE INDEX idx_entity_appearances_profile_id ON public.entity_appearances USING btree (profile_id);
CREATE INDEX idx_entity_appearances_quote_id ON public.entity_appearances USING btree (quote_id);
CREATE INDEX idx_entity_appearances_type ON public.entity_appearances USING btree (appearance_type);
CREATE INDEX idx_entries_collection_id ON public.entries USING btree (collection_id);
CREATE INDEX idx_entries_occurred_on ON public.entries USING btree (occurred_on) WHERE (occurred_on IS NOT NULL);
CREATE INDEX idx_entry_images_locked ON public.entry_images USING btree (locked) WHERE (locked = true);
CREATE INDEX idx_entry_media_locked ON public.entry_media USING btree (locked) WHERE (locked = true);
CREATE INDEX idx_entry_votes_entry_id ON public.entry_votes USING btree (entry_id);
CREATE INDEX idx_entry_votes_user_id ON public.entry_votes USING btree (user_id);
CREATE INDEX idx_lifelines_entity_id ON public.lifelines USING btree (entity_id);
CREATE INDEX idx_lifelines_featured ON public.lifelines USING btree (collection_id, is_featured, status);
CREATE INDEX idx_media_assets_collection_tags ON public.media_assets USING gin (collection_tags);
CREATE INDEX idx_notifications_read ON public.notifications USING btree (read);
CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);
CREATE INDEX idx_profile_collections_collection ON public.profile_collections USING btree (collection_id);
CREATE INDEX idx_profile_collections_profile ON public.profile_collections USING btree (profile_id);

-- ============================================
-- End of Schema
-- ============================================
