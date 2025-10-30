-- Add locked field to entry_media table (this is the correct table being used)
ALTER TABLE public.entry_media 
ADD COLUMN IF NOT EXISTS locked boolean NOT NULL DEFAULT false;

-- Create index for faster locked image queries
CREATE INDEX IF NOT EXISTS idx_entry_media_locked ON public.entry_media(locked) WHERE locked = true;

-- Add comment
COMMENT ON COLUMN public.entry_media.locked IS 'Indicates if this image is locked by a superfan and cannot be deleted';