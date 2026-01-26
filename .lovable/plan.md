

## Execute Collection Ownership RLS Policy Migration

### Current Status
- Migration file exists: `supabase/migrations/20260126181500_allow_creators_to_claim_ownership.sql`
- Frontend code updated in `UserProfile.tsx` to insert owner role after collection creation
- **Missing**: The RLS policy has not been applied to the database

### What I Will Do

Run the database migration to create the RLS policy:

```sql
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
```

### Result
After this migration runs, users who create social collections will be able to assign themselves as the owner, allowing them to add content to their collections.

