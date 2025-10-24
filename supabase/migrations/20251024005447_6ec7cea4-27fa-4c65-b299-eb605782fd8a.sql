-- Create home_page_settings table
CREATE TABLE public.home_page_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hero_image_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  hero_title TEXT,
  hero_subtitle TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create home_page_featured_items table
CREATE TABLE public.home_page_featured_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_type TEXT NOT NULL CHECK (item_type IN ('lifeline', 'collection', 'election')),
  item_id UUID NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create home_page_new_content_items table
CREATE TABLE public.home_page_new_content_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_type TEXT NOT NULL CHECK (item_type IN ('lifeline', 'collection', 'election')),
  item_id UUID NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.home_page_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_page_featured_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_page_new_content_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for home_page_settings
CREATE POLICY "Public can view home_page_settings"
  ON public.home_page_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins and editors can manage home_page_settings"
  ON public.home_page_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

-- RLS Policies for home_page_featured_items
CREATE POLICY "Public can view home_page_featured_items"
  ON public.home_page_featured_items FOR SELECT
  USING (true);

CREATE POLICY "Admins and editors can manage home_page_featured_items"
  ON public.home_page_featured_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

-- RLS Policies for home_page_new_content_items
CREATE POLICY "Public can view home_page_new_content_items"
  ON public.home_page_new_content_items FOR SELECT
  USING (true);

CREATE POLICY "Admins and editors can manage home_page_new_content_items"
  ON public.home_page_new_content_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

-- Insert default settings
INSERT INTO public.home_page_settings (hero_title, hero_subtitle)
VALUES ('Welcome to Lifeline Public', 'Explore stories, profiles, and collections');

-- Create trigger for updated_at
CREATE TRIGGER update_home_page_settings_updated_at
  BEFORE UPDATE ON public.home_page_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();