-- Allow collection creators to assign themselves as owner
-- This fixes the issue where users create a collection but can't
-- add content because they're not in collection_roles

CREATE POLICY "Creators can claim ownership"
ON public.collection_roles
FOR INSERT
WITH CHECK (
    -- User is inserting themselves as owner
    user_id = auth.uid()
    AND role = 'owner'
    -- And they are the creator of the collection
    AND EXISTS (
        SELECT 1 FROM public.collections
        WHERE id = collection_id
        AND created_by = auth.uid()
    )
    -- And they don't already have a role in this collection
    AND NOT EXISTS (
        SELECT 1 FROM public.collection_roles cr
        WHERE cr.collection_id = collection_roles.collection_id
        AND cr.user_id = auth.uid()
    )
);
