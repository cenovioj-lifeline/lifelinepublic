-- Add hidden_from_list column to collection_members
ALTER TABLE public.collection_members 
ADD COLUMN hidden_from_list boolean NOT NULL DEFAULT false;

-- Add UPDATE policy so users can update their own membership (for hiding from list)
CREATE POLICY "Users can update their own membership"
ON public.collection_members
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);