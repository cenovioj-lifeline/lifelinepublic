-- Create apps table for external app/website links
CREATE TABLE public.apps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  app_url TEXT,
  thumbnail_url TEXT,
  thumbnail_path TEXT,
  collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint on slug
ALTER TABLE public.apps ADD CONSTRAINT apps_slug_key UNIQUE (slug);

-- Create index for collection lookups
CREATE INDEX idx_apps_collection_id ON public.apps(collection_id);

-- Enable RLS
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;

-- RLS policies for apps (mirroring videos table)
CREATE POLICY "Public can view published apps"
  ON public.apps
  FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins and editors can manage apps"
  ON public.apps
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

CREATE POLICY "Collection owners can manage their apps"
  ON public.apps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM collection_roles
      WHERE collection_roles.collection_id = apps.collection_id
      AND collection_roles.user_id = auth.uid()
      AND collection_roles.role = ANY (ARRAY['owner', 'editor'])
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_apps_updated_at
  BEFORE UPDATE ON public.apps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();