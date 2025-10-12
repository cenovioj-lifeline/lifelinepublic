-- Add web_primary and web_secondary color fields to collections
ALTER TABLE public.collections 
ADD COLUMN web_primary text,
ADD COLUMN web_secondary text;