-- Add subject field to lifelines table
ALTER TABLE public.lifelines ADD COLUMN subject TEXT;

-- Create lifeline_settings table for storing color configurations
CREATE TABLE public.lifeline_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on lifeline_settings
ALTER TABLE public.lifeline_settings ENABLE ROW LEVEL SECURITY;

-- Admins and editors can manage lifeline_settings
CREATE POLICY "Admins and editors can manage lifeline_settings"
  ON public.lifeline_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

-- Public can view lifeline_settings
CREATE POLICY "Public can view lifeline_settings"
  ON public.lifeline_settings
  FOR SELECT
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_lifeline_settings_updated_at
  BEFORE UPDATE ON public.lifeline_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default lifeline color settings
INSERT INTO public.lifeline_settings (setting_key, setting_value, description) VALUES
  ('lifeline_bg_color', '#ffffff', 'Background color for lifeline pages'),
  ('lifeline_text_color', '#000000', 'Primary text color'),
  ('lifeline_heading_color', '#1a1a1a', 'Heading color'),
  ('lifeline_accent_color', '#3b82f6', 'Accent color for links and highlights'),
  ('lifeline_card_bg', '#f9fafb', 'Card background color'),
  ('lifeline_border_color', '#e5e7eb', 'Border color'),
  ('lifeline_timeline_positive', '#16a34a', 'Timeline color for positive events'),
  ('lifeline_timeline_negative', '#dc2626', 'Timeline color for negative events'),
  ('lifeline_timeline_neutral', '#6b7280', 'Timeline color for neutral events');