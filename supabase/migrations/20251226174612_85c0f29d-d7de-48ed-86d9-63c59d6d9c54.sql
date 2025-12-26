-- Add person_name_accent column to color_schemes table
ALTER TABLE public.color_schemes 
ADD COLUMN person_name_accent text DEFAULT '#4a9eff';

COMMENT ON COLUMN public.color_schemes.person_name_accent IS 'Accent color for person names on lifeline cards';