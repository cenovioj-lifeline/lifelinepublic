-- Collection Ownership System Tables
-- Creates tables for tracking collection ownership, roles, and ownership requests

-- 1. Collection Roles Table
-- Tracks user roles within collections (owner, editor, contributor)
CREATE TABLE public.collection_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    collection_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL DEFAULT 'contributor',
    invited_by uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT collection_roles_pkey PRIMARY KEY (id),
    CONSTRAINT collection_roles_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.collections(id) ON DELETE CASCADE,
    CONSTRAINT collection_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT collection_roles_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT collection_roles_role_check CHECK (role IN ('owner', 'editor', 'contributor')),
    CONSTRAINT collection_roles_unique_user_collection UNIQUE (collection_id, user_id)
);

CREATE INDEX idx_collection_roles_user_id ON public.collection_roles USING btree (user_id);
CREATE INDEX idx_collection_roles_collection_id ON public.collection_roles USING btree (collection_id);

-- Enable RLS
ALTER TABLE public.collection_roles ENABLE ROW LEVEL SECURITY;

-- 2. Collection Ownership Requests Table
-- Tracks requests from users to claim ownership of public collections
CREATE TABLE public.collection_ownership_requests (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    collection_id uuid NOT NULL,
    user_id uuid NOT NULL,
    email text NOT NULL,
    claim_reason text NOT NULL,
    proof_links text[] DEFAULT '{}'::text[],
    status text NOT NULL DEFAULT 'pending',
    admin_notes text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT collection_ownership_requests_pkey PRIMARY KEY (id),
    CONSTRAINT collection_ownership_requests_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.collections(id) ON DELETE CASCADE,
    CONSTRAINT collection_ownership_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT collection_ownership_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT collection_ownership_requests_status_check CHECK (status IN ('pending', 'approved', 'denied', 'more_info_needed')),
    CONSTRAINT collection_ownership_requests_unique_user_collection UNIQUE (collection_id, user_id)
);

CREATE INDEX idx_collection_ownership_requests_status ON public.collection_ownership_requests USING btree (status);
CREATE INDEX idx_collection_ownership_requests_user_id ON public.collection_ownership_requests USING btree (user_id);

-- Enable RLS
ALTER TABLE public.collection_ownership_requests ENABLE ROW LEVEL SECURITY;

-- 3. Add visibility column to collections (if not exists)
ALTER TABLE public.collections
ADD COLUMN IF NOT EXISTS visibility visibility_type NOT NULL DEFAULT 'public'::visibility_type;

-- 4. RLS Policies for collection_roles

-- Users can view roles for collections they belong to
CREATE POLICY "Users can view their collection roles"
ON public.collection_roles
FOR SELECT
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.collection_roles cr
        WHERE cr.collection_id = collection_roles.collection_id
        AND cr.user_id = auth.uid()
    )
);

-- Owners can invite members
CREATE POLICY "Owners can invite members"
ON public.collection_roles
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.collection_roles cr
        WHERE cr.collection_id = collection_roles.collection_id
        AND cr.user_id = auth.uid()
        AND cr.role = 'owner'
    )
    OR has_role(auth.uid(), 'admin'::user_role)
);

-- Owners can update member roles (but not their own owner role)
CREATE POLICY "Owners can update member roles"
ON public.collection_roles
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.collection_roles cr
        WHERE cr.collection_id = collection_roles.collection_id
        AND cr.user_id = auth.uid()
        AND cr.role = 'owner'
    )
    OR has_role(auth.uid(), 'admin'::user_role)
);

-- Owners can remove members (but not themselves)
CREATE POLICY "Owners can remove members"
ON public.collection_roles
FOR DELETE
USING (
    (
        EXISTS (
            SELECT 1 FROM public.collection_roles cr
            WHERE cr.collection_id = collection_roles.collection_id
            AND cr.user_id = auth.uid()
            AND cr.role = 'owner'
        )
        AND user_id != auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::user_role)
);

-- Admins can manage all collection roles
CREATE POLICY "Admins can manage collection roles"
ON public.collection_roles
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

-- 5. RLS Policies for collection_ownership_requests

-- Users can view their own requests
CREATE POLICY "Users can view their own ownership requests"
ON public.collection_ownership_requests
FOR SELECT
USING (user_id = auth.uid());

-- Users can create requests (only if they don't already have a role in the collection)
CREATE POLICY "Users can create ownership requests"
ON public.collection_ownership_requests
FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND NOT EXISTS (
        SELECT 1 FROM public.collection_roles cr
        WHERE cr.collection_id = collection_ownership_requests.collection_id
        AND cr.user_id = auth.uid()
    )
);

-- Users can update their own pending requests
CREATE POLICY "Users can update their pending requests"
ON public.collection_ownership_requests
FOR UPDATE
USING (
    user_id = auth.uid()
    AND status = 'pending'
);

-- Admins can view all requests
CREATE POLICY "Admins can view all ownership requests"
ON public.collection_ownership_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

-- Admins can update requests (approve/deny)
CREATE POLICY "Admins can update ownership requests"
ON public.collection_ownership_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

-- 6. Helper function to check if user can edit a collection
CREATE OR REPLACE FUNCTION public.can_edit_collection(p_collection_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.collection_roles
        WHERE collection_id = p_collection_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'editor')
    )
    OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    );
$$;