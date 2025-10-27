-- Create color_schemes table for unified 20-color system
CREATE TABLE IF NOT EXISTS public.color_schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  
  -- Navigation Colors (3)
  nav_bg_color TEXT NOT NULL DEFAULT '#000000',
  nav_text_color TEXT NOT NULL DEFAULT '#FFFFFF',
  nav_button_color TEXT NOT NULL DEFAULT '#FFFFFF',
  
  -- Collection Home Colors (8)
  banner_text_color TEXT NOT NULL DEFAULT '#FFFFFF',
  actions_bg_color TEXT NOT NULL DEFAULT '#F5F5F5',
  actions_border_color TEXT NOT NULL DEFAULT '#E0E0E0',
  actions_icon_color TEXT NOT NULL DEFAULT '#333333',
  actions_text_color TEXT NOT NULL DEFAULT '#333333',
  card_bg_color TEXT NOT NULL DEFAULT '#FFFFFF',
  card_border_color TEXT NOT NULL DEFAULT '#E0E0E0',
  card_text_color TEXT NOT NULL DEFAULT '#333333',
  
  -- Lifeline Display Colors (6)
  ll_display_border TEXT NOT NULL DEFAULT '#565D6D',
  ll_display_bg TEXT NOT NULL DEFAULT '#FFFFFF',
  ll_display_title_text TEXT NOT NULL DEFAULT '#000000',
  ll_graph_positive TEXT NOT NULL DEFAULT '#22C55E',
  ll_graph_negative TEXT NOT NULL DEFAULT '#EF4444',
  ll_graph_line TEXT NOT NULL DEFAULT '#565D6D',
  
  -- Lifeline Entry Colors (3)
  ll_entry_header TEXT NOT NULL DEFAULT '#F5F5F5',
  ll_entry_button TEXT NOT NULL DEFAULT '#3B82F6',
  ll_entry_contributor_button TEXT NOT NULL DEFAULT '#8B5CF6',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.color_schemes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view color schemes"
  ON public.color_schemes FOR SELECT
  USING (true);

CREATE POLICY "Admins and editors can manage color schemes"
  ON public.color_schemes FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

-- Add color_scheme_id to collections
ALTER TABLE public.collections 
ADD COLUMN IF NOT EXISTS color_scheme_id UUID REFERENCES public.color_schemes(id);

-- Create default color scheme
INSERT INTO public.color_schemes (
  name, 
  description, 
  is_default,
  nav_bg_color,
  nav_text_color,
  nav_button_color,
  banner_text_color,
  actions_bg_color,
  actions_border_color,
  actions_icon_color,
  actions_text_color,
  card_bg_color,
  card_border_color,
  card_text_color,
  ll_display_border,
  ll_display_bg,
  ll_display_title_text,
  ll_graph_positive,
  ll_graph_negative,
  ll_graph_line,
  ll_entry_header,
  ll_entry_button,
  ll_entry_contributor_button
) VALUES (
  'Default Theme',
  'Default color scheme for the site',
  true,
  '#1a1a1a',
  '#ffffff',
  '#ffffff',
  '#ffffff',
  '#f5f5f5',
  '#e0e0e0',
  '#333333',
  '#333333',
  '#ffffff',
  '#e0e0e0',
  '#1f2937',
  '#565D6D',
  '#ffffff',
  '#000000',
  '#22C55E',
  '#EF4444',
  '#565D6D',
  '#f5f5f5',
  '#3B82F6',
  '#8B5CF6'
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_color_schemes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_color_schemes_updated_at
  BEFORE UPDATE ON public.color_schemes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_color_schemes_updated_at();