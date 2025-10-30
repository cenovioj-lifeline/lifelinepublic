-- Add locked field to entry_images table
ALTER TABLE public.entry_images 
ADD COLUMN locked boolean NOT NULL DEFAULT false;

-- Create index for faster locked image queries
CREATE INDEX idx_entry_images_locked ON public.entry_images(locked) WHERE locked = true;

-- Add comment
COMMENT ON COLUMN public.entry_images.locked IS 'Indicates if this image is locked by a superfan and cannot be deleted';