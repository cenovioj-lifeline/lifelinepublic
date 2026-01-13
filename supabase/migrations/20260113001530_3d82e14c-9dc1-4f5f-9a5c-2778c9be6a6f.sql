-- Seed default action cards
INSERT INTO public.action_cards (name, slug, icon_name, description, is_default, default_order, is_implemented, status)
VALUES 
  ('Feed', 'feed', 'Rss', 'View the latest updates and content', true, 1, true, 'active'),
  ('Share', 'share', 'Share2', 'Share this collection with others', true, 2, true, 'active'),
  ('Members', 'members', 'Users', 'View community members', true, 3, true, 'active'),
  ('Settings', 'settings', 'Settings', 'Customize your experience', true, 4, true, 'active')
ON CONFLICT (slug) DO UPDATE SET
  is_default = EXCLUDED.is_default,
  default_order = EXCLUDED.default_order;