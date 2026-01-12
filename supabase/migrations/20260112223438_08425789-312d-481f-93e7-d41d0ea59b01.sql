-- Create action_cards table for storing action card definitions
CREATE TABLE public.action_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT,
  icon_url TEXT,
  is_default BOOLEAN DEFAULT false,
  default_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  is_implemented BOOLEAN DEFAULT false,
  implementation_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collection_action_cards table for collection-specific card assignments
CREATE TABLE public.collection_action_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  action_card_id UUID NOT NULL REFERENCES public.action_cards(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  label_override TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(collection_id, action_card_id)
);

-- Enable RLS
ALTER TABLE public.action_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_action_cards ENABLE ROW LEVEL SECURITY;

-- RLS policies for action_cards (public read, admin write)
CREATE POLICY "Anyone can view action cards"
ON public.action_cards FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage action cards"
ON public.action_cards FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS policies for collection_action_cards
CREATE POLICY "Anyone can view collection action cards"
ON public.collection_action_cards FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage collection action cards"
ON public.collection_action_cards FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create indexes for performance
CREATE INDEX idx_action_cards_slug ON public.action_cards(slug);
CREATE INDEX idx_action_cards_status ON public.action_cards(status);
CREATE INDEX idx_action_cards_is_default ON public.action_cards(is_default);
CREATE INDEX idx_collection_action_cards_collection ON public.collection_action_cards(collection_id);
CREATE INDEX idx_collection_action_cards_action_card ON public.collection_action_cards(action_card_id);

-- Create trigger for updated_at
CREATE TRIGGER update_action_cards_updated_at
BEFORE UPDATE ON public.action_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collection_action_cards_updated_at
BEFORE UPDATE ON public.collection_action_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();