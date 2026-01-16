-- Create videos table
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  youtube_url TEXT,
  description TEXT,
  thumbnail_url TEXT,
  thumbnail_path TEXT,
  collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create podcasts table
CREATE TABLE public.podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  season TEXT,
  description TEXT,
  podcast_url TEXT,
  thumbnail_url TEXT,
  thumbnail_path TEXT,
  collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.podcasts ENABLE ROW LEVEL SECURITY;

-- Videos RLS policies
CREATE POLICY "Public can view published videos"
ON public.videos FOR SELECT
USING (status = 'published');

CREATE POLICY "Admins and editors can manage videos"
ON public.videos FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

CREATE POLICY "Collection owners can manage their videos"
ON public.videos FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM collection_roles
    WHERE collection_roles.collection_id = videos.collection_id
    AND collection_roles.user_id = auth.uid()
    AND collection_roles.role IN ('owner', 'editor')
  )
);

-- Podcasts RLS policies
CREATE POLICY "Public can view published podcasts"
ON public.podcasts FOR SELECT
USING (status = 'published');

CREATE POLICY "Admins and editors can manage podcasts"
ON public.podcasts FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

CREATE POLICY "Collection owners can manage their podcasts"
ON public.podcasts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM collection_roles
    WHERE collection_roles.collection_id = podcasts.collection_id
    AND collection_roles.user_id = auth.uid()
    AND collection_roles.role IN ('owner', 'editor')
  )
);

-- Create indexes for common queries
CREATE INDEX idx_videos_collection_id ON public.videos(collection_id);
CREATE INDEX idx_videos_profile_id ON public.videos(profile_id);
CREATE INDEX idx_videos_status ON public.videos(status);
CREATE INDEX idx_podcasts_collection_id ON public.podcasts(collection_id);
CREATE INDEX idx_podcasts_profile_id ON public.podcasts(profile_id);
CREATE INDEX idx_podcasts_status ON public.podcasts(status);