-- ============================================
-- COLLECTION INVITES - DATABASE SCHEMA
-- Created: 2026-01-04
-- Purpose: Enable owners to invite members by email
-- ============================================

-- ============================================
-- SECTION 1: COLLECTION INVITES TABLE
-- ============================================

-- Stores pending invitations that haven't been accepted yet
-- When invitee signs in, they can accept/decline the invite
CREATE TABLE public.collection_invites (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    collection_id uuid NOT NULL,
    email text NOT NULL,
    role text NOT NULL DEFAULT 'editor',
    invited_by uuid NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + interval '30 days'),
    accepted_at timestamp with time zone,

    -- Constraints
    CONSTRAINT collection_invites_pkey PRIMARY KEY (id),
    CONSTRAINT collection_invites_collection_id_fkey FOREIGN KEY (collection_id)
        REFERENCES public.collections(id) ON DELETE CASCADE,
    CONSTRAINT collection_invites_invited_by_fkey FOREIGN KEY (invited_by)
        REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT collection_invites_role_check CHECK (role IN ('editor', 'contributor')),
    CONSTRAINT collection_invites_status_check CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    CONSTRAINT collection_invites_unique_email_collection UNIQUE (collection_id, email)
);

-- Index for fast lookups
CREATE INDEX idx_collection_invites_email ON public.collection_invites USING btree (lower(email));
CREATE INDEX idx_collection_invites_collection_id ON public.collection_invites USING btree (collection_id);
CREATE INDEX idx_collection_invites_status ON public.collection_invites USING btree (status);


-- ============================================
-- SECTION 2: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

ALTER TABLE public.collection_invites ENABLE ROW LEVEL SECURITY;

-- Owners can view invites for their collections
CREATE POLICY "Owners can view collection invites"
    ON public.collection_invites
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.collection_roles
            WHERE collection_id = collection_invites.collection_id
            AND user_id = auth.uid()
            AND role = 'owner'
        )
    );

-- Owners can create invites
CREATE POLICY "Owners can create invites"
    ON public.collection_invites
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.collection_roles
            WHERE collection_id = collection_invites.collection_id
            AND user_id = auth.uid()
            AND role = 'owner'
        )
        AND invited_by = auth.uid()
    );

-- Owners can update invites (e.g., cancel)
CREATE POLICY "Owners can update invites"
    ON public.collection_invites
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.collection_roles
            WHERE collection_id = collection_invites.collection_id
            AND user_id = auth.uid()
            AND role = 'owner'
        )
    );

-- Owners can delete invites
CREATE POLICY "Owners can delete invites"
    ON public.collection_invites
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.collection_roles
            WHERE collection_id = collection_invites.collection_id
            AND user_id = auth.uid()
            AND role = 'owner'
        )
    );

-- Users can view invites sent to their email
-- Note: This checks against auth.jwt() to get the user's email
CREATE POLICY "Users can view their own invites"
    ON public.collection_invites
    FOR SELECT
    USING (
        lower(email) = lower(auth.jwt() ->> 'email')
    );

-- Users can update their own invites (to accept/decline)
CREATE POLICY "Users can accept/decline their invites"
    ON public.collection_invites
    FOR UPDATE
    USING (
        lower(email) = lower(auth.jwt() ->> 'email')
        AND status = 'pending'
    )
    WITH CHECK (
        lower(email) = lower(auth.jwt() ->> 'email')
        AND status IN ('accepted', 'declined')
    );

-- Admins can manage all invites
CREATE POLICY "Admins can manage all invites"
    ON public.collection_invites
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );


-- ============================================
-- SECTION 3: HELPER FUNCTION
-- ============================================

-- Function to accept an invite and create the role
-- Call: SELECT accept_collection_invite('invite-uuid')
CREATE OR REPLACE FUNCTION public.accept_collection_invite(p_invite_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invite record;
    v_user_id uuid;
    v_role_id uuid;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    -- Get the invite
    SELECT * INTO v_invite
    FROM public.collection_invites
    WHERE id = p_invite_id
    AND lower(email) = lower(auth.jwt() ->> 'email')
    AND status = 'pending';

    IF v_invite IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invite not found or already processed');
    END IF;

    -- Check if expired
    IF v_invite.expires_at < now() THEN
        UPDATE public.collection_invites
        SET status = 'expired'
        WHERE id = p_invite_id;
        RETURN jsonb_build_object('success', false, 'error', 'Invite has expired');
    END IF;

    -- Check if user already has a role
    IF EXISTS (
        SELECT 1 FROM public.collection_roles
        WHERE collection_id = v_invite.collection_id
        AND user_id = v_user_id
    ) THEN
        -- Update invite status anyway
        UPDATE public.collection_invites
        SET status = 'accepted', accepted_at = now()
        WHERE id = p_invite_id;
        RETURN jsonb_build_object('success', false, 'error', 'Already a member of this collection');
    END IF;

    -- Create the role
    INSERT INTO public.collection_roles (collection_id, user_id, role, invited_by)
    VALUES (v_invite.collection_id, v_user_id, v_invite.role, v_invite.invited_by)
    RETURNING id INTO v_role_id;

    -- Update invite status
    UPDATE public.collection_invites
    SET status = 'accepted', accepted_at = now()
    WHERE id = p_invite_id;

    RETURN jsonb_build_object(
        'success', true,
        'role_id', v_role_id,
        'collection_id', v_invite.collection_id,
        'role', v_invite.role
    );
END;
$$;