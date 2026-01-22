-- Create start_button_categories table
CREATE TABLE IF NOT EXISTS public.start_button_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    icon TEXT,
    links JSONB DEFAULT '[]'::jsonb,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for efficient ordering
CREATE INDEX IF NOT EXISTS idx_start_button_categories_order 
ON public.start_button_categories(display_order) 
WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.start_button_categories ENABLE ROW LEVEL SECURITY;

-- Public read access for active categories
CREATE POLICY "Anyone can view active categories"
ON public.start_button_categories
FOR SELECT
USING (is_active = true);

-- Admin write access using user_roles table
CREATE POLICY "Admins can manage categories"
ON public.start_button_categories
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
);

-- Seed the 9 categories
INSERT INTO public.start_button_categories (title, subtitle, description, icon, links, display_order) VALUES
(
    'Improve Relationships',
    'Know the people you love',
    'E.g. "I created a "Lifeline" for my Dad showing his timeline and accomplishments - something he''ll love but would never take time to create. It took 30 min, and I just kept adding stories over time."',
    '💝',
    '[{"label": "Create a Family Lifeline", "url": "/create/family", "type": "primary"}]'::jsonb,
    1
),
(
    'Entertaining Content',
    'Fan sites, but better',
    'E.g. "I love following my favorite musicians, athletes, and creators. Rather than scattered social posts, Lifeline Public gives me a complete picture—their journey, key moments, and what made them who they are."',
    '🎬',
    '[{"label": "Explore Fan Collections", "url": "/collections", "type": "primary"}]'::jsonb,
    2
),
(
    'Educational Content',
    'Stories that stick',
    'E.g. "History class was boring memorization. But when I see FDR''s timeline—polio at 39, elected president at 51—suddenly I understand resilience. Context makes learning stick."',
    '📚',
    '[{"label": "Browse Educational Content", "url": "/lifelines", "type": "primary"}]'::jsonb,
    3
),
(
    'Personal Development',
    'Stop losing the good stuff',
    'E.g. "I consume amazing content but forget 90% of it. Now I clip insights to my personal Lifeline—building a searchable archive of wisdom that compounds over time."',
    '🌱',
    '[{"label": "Start Your Journey", "url": "/create/personal", "type": "primary"}]'::jsonb,
    4
),
(
    'Career Development',
    'Your story, not just achievements',
    'E.g. "My resume lists jobs. My Lifeline shows the narrative—the pivot after burnout, the mentor who changed everything, the project that redefined my path. It''s how I actually got hired."',
    '💼',
    '[{"label": "Build Your Career Story", "url": "/create/career", "type": "primary"}]'::jsonb,
    5
),
(
    'Social Media',
    'Share real stories',
    'E.g. "Instagram shows highlights. Twitter shows takes. Lifeline shows journeys. When I share a timeline moment, people actually engage with the story, not just the snapshot."',
    '📱',
    '[{"label": "Connect Your Socials", "url": "/connect", "type": "primary"}]'::jsonb,
    6
),
(
    'Local Social',
    'Your community, connected',
    'E.g. "I created a Lifeline for our neighborhood—the old bakery that closed, the park renovation, the families who''ve been here for decades. It''s living local history."',
    '🏘️',
    '[{"label": "Start a Local Collection", "url": "/create/community", "type": "primary"}]'::jsonb,
    7
),
(
    'Promotional Platform',
    'Your platform within the platform',
    'E.g. "As a creator, I needed a way to showcase my work that isn''t just a portfolio grid. My Lifeline shows the evolution—early experiments, breakthrough moments, what I''m building now."',
    '🚀',
    '[{"label": "Create Your Platform", "url": "/create/creator", "type": "primary"}]'::jsonb,
    8
),
(
    'TLC - The Learning Class',
    'Learn how to learn',
    'E.g. "Education shouldn''t just be content consumption. TLC uses Lifelines to teach pattern recognition—seeing how great minds evolved helps you evolve your own thinking."',
    '🎓',
    '[{"label": "Join TLC", "url": "/tlc", "type": "primary"}]'::jsonb,
    9
);