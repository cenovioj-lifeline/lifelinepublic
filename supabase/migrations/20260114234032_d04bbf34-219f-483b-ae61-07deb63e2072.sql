-- Add behavior columns to action_cards table
ALTER TABLE public.action_cards
ADD COLUMN behavior_type text DEFAULT 'context_aware',
ADD COLUMN static_url text,
ADD COLUMN behavior_description text;

-- Add check constraint for behavior_type values
ALTER TABLE public.action_cards
ADD CONSTRAINT action_cards_behavior_type_check 
CHECK (behavior_type IN ('static_url', 'context_aware', 'custom'));

-- Add comment for documentation
COMMENT ON COLUMN public.action_cards.behavior_type IS 'static_url: fixed URL, context_aware: built-in adaptive behavior, custom: requires Lovable implementation';
COMMENT ON COLUMN public.action_cards.static_url IS 'Target URL when behavior_type is static_url';
COMMENT ON COLUMN public.action_cards.behavior_description IS 'Read-only description of the behavior for context_aware and custom types';