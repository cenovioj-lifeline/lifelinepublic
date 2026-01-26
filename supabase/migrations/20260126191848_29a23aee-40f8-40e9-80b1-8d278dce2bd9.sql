CREATE POLICY "Creators can claim ownership"
ON public.collection_roles
FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND role = 'owner'
    AND EXISTS (
        SELECT 1 FROM public.collections
        WHERE id = collection_id
        AND created_by = auth.uid()
    )
    AND NOT EXISTS (
        SELECT 1 FROM public.collection_roles cr
        WHERE cr.collection_id = collection_roles.collection_id
        AND cr.user_id = auth.uid()
    )
);