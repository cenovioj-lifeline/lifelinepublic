-- ============================================
-- CONTENT RLS POLICIES - COLLECTION OWNERSHIP
-- Created: 2026-01-04
-- Purpose: Enforce collection_roles permissions on content tables
-- ============================================

-- ============================================
-- SECTION 1: LIFELINES TABLE RLS
-- ============================================

ALTER TABLE public.lifelines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view lifelines" ON public.lifelines;
DROP POLICY IF EXISTS "Collection members can insert lifelines" ON public.lifelines;
DROP POLICY IF EXISTS "Collection members can update lifelines" ON public.lifelines;
DROP POLICY IF EXISTS "Collection members can delete lifelines" ON public.lifelines;
DROP POLICY IF EXISTS "Admins can manage all lifelines" ON public.lifelines;

CREATE POLICY "Anyone can view lifelines"
    ON public.lifelines
    FOR SELECT
    USING (true);

CREATE POLICY "Collection members can insert lifelines"
    ON public.lifelines
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.collection_roles
            WHERE collection_id = lifelines.collection_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'editor')
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Collection members can update lifelines"
    ON public.lifelines
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.collection_roles
            WHERE collection_id = lifelines.collection_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'editor')
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Collection members can delete lifelines"
    ON public.lifelines
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.collection_roles
            WHERE collection_id = lifelines.collection_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'editor')
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );


-- ============================================
-- SECTION 2: ENTRIES TABLE RLS
-- ============================================

ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view entries" ON public.entries;
DROP POLICY IF EXISTS "Collection members can insert entries" ON public.entries;
DROP POLICY IF EXISTS "Collection members can update entries" ON public.entries;
DROP POLICY IF EXISTS "Collection members can delete entries" ON public.entries;

CREATE POLICY "Anyone can view entries"
    ON public.entries
    FOR SELECT
    USING (true);

CREATE POLICY "Collection members can insert entries"
    ON public.entries
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.lifelines l
            JOIN public.collection_roles cr ON cr.collection_id = l.collection_id
            WHERE l.id = entries.lifeline_id
            AND cr.user_id = auth.uid()
            AND cr.role IN ('owner', 'editor')
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Collection members can update entries"
    ON public.entries
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.lifelines l
            JOIN public.collection_roles cr ON cr.collection_id = l.collection_id
            WHERE l.id = entries.lifeline_id
            AND cr.user_id = auth.uid()
            AND cr.role IN ('owner', 'editor')
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Collection members can delete entries"
    ON public.entries
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.lifelines l
            JOIN public.collection_roles cr ON cr.collection_id = l.collection_id
            WHERE l.id = entries.lifeline_id
            AND cr.user_id = auth.uid()
            AND cr.role IN ('owner', 'editor')
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );


-- ============================================
-- SECTION 3: PROFILES TABLE RLS
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Collection members can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Collection members can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Collection members can delete profiles" ON public.profiles;

CREATE POLICY "Anyone can view profiles"
    ON public.profiles
    FOR SELECT
    USING (true);

CREATE POLICY "Collection members can insert profiles"
    ON public.profiles
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.collection_roles
            WHERE collection_id = profiles.primary_collection_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'editor')
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Collection members can update profiles"
    ON public.profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.collection_roles
            WHERE collection_id = profiles.primary_collection_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'editor')
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Collection members can delete profiles"
    ON public.profiles
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.collection_roles
            WHERE collection_id = profiles.primary_collection_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'editor')
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );


-- ============================================
-- SECTION 4: COLLECTION_QUOTES TABLE RLS
-- ============================================

ALTER TABLE public.collection_quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view collection_quotes" ON public.collection_quotes;
DROP POLICY IF EXISTS "Collection members can insert collection_quotes" ON public.collection_quotes;
DROP POLICY IF EXISTS "Collection members can update collection_quotes" ON public.collection_quotes;
DROP POLICY IF EXISTS "Collection members can delete collection_quotes" ON public.collection_quotes;

CREATE POLICY "Anyone can view collection_quotes"
    ON public.collection_quotes
    FOR SELECT
    USING (true);

CREATE POLICY "Collection members can insert collection_quotes"
    ON public.collection_quotes
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.collection_roles
            WHERE collection_id = collection_quotes.collection_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'editor')
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Collection members can update collection_quotes"
    ON public.collection_quotes
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.collection_roles
            WHERE collection_id = collection_quotes.collection_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'editor')
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Collection members can delete collection_quotes"
    ON public.collection_quotes
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.collection_roles
            WHERE collection_id = collection_quotes.collection_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'editor')
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );


-- ============================================
-- SECTION 5: MOCK_ELECTIONS TABLE RLS
-- ============================================

ALTER TABLE public.mock_elections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view mock_elections" ON public.mock_elections;
DROP POLICY IF EXISTS "Collection members can insert mock_elections" ON public.mock_elections;
DROP POLICY IF EXISTS "Collection members can update mock_elections" ON public.mock_elections;
DROP POLICY IF EXISTS "Collection members can delete mock_elections" ON public.mock_elections;

CREATE POLICY "Anyone can view mock_elections"
    ON public.mock_elections
    FOR SELECT
    USING (true);

CREATE POLICY "Collection members can insert mock_elections"
    ON public.mock_elections
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.collection_roles
            WHERE collection_id = mock_elections.collection_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'editor')
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Collection members can update mock_elections"
    ON public.mock_elections
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.collection_roles
            WHERE collection_id = mock_elections.collection_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'editor')
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Collection members can delete mock_elections"
    ON public.mock_elections
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.collection_roles
            WHERE collection_id = mock_elections.collection_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'editor')
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );


-- ============================================
-- SECTION 6: ELECTION_RESULTS TABLE RLS
-- ============================================

ALTER TABLE public.election_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view election_results" ON public.election_results;
DROP POLICY IF EXISTS "Collection members can insert election_results" ON public.election_results;
DROP POLICY IF EXISTS "Collection members can update election_results" ON public.election_results;
DROP POLICY IF EXISTS "Collection members can delete election_results" ON public.election_results;

CREATE POLICY "Anyone can view election_results"
    ON public.election_results
    FOR SELECT
    USING (true);

CREATE POLICY "Collection members can insert election_results"
    ON public.election_results
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.mock_elections me
            JOIN public.collection_roles cr ON cr.collection_id = me.collection_id
            WHERE me.id = election_results.election_id
            AND cr.user_id = auth.uid()
            AND cr.role IN ('owner', 'editor')
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Collection members can update election_results"
    ON public.election_results
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.mock_elections me
            JOIN public.collection_roles cr ON cr.collection_id = me.collection_id
            WHERE me.id = election_results.election_id
            AND cr.user_id = auth.uid()
            AND cr.role IN ('owner', 'editor')
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Collection members can delete election_results"
    ON public.election_results
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.mock_elections me
            JOIN public.collection_roles cr ON cr.collection_id = me.collection_id
            WHERE me.id = election_results.election_id
            AND cr.user_id = auth.uid()
            AND cr.role IN ('owner', 'editor')
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );