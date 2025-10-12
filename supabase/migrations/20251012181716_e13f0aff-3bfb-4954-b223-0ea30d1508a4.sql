-- Create table to store election result category ordering
CREATE TABLE public.election_category_order (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT -1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.election_category_order ENABLE ROW LEVEL SECURITY;

-- Admins and editors can manage category ordering
CREATE POLICY "Admins and editors can manage category_order"
ON public.election_category_order
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

-- Everyone can view category ordering (needed for public display)
CREATE POLICY "Public can view category_order"
ON public.election_category_order
FOR SELECT
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_election_category_order_updated_at
BEFORE UPDATE ON public.election_category_order
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_election_category_order_category ON public.election_category_order(category);
CREATE INDEX idx_election_category_order_display_order ON public.election_category_order(display_order);