-- Migration: Monitoring System
-- Purpose: Add fields to support automated collection monitoring and updates

-- ENTRIES TABLE: Track how each entry was created
ALTER TABLE entries
ADD COLUMN IF NOT EXISTS origin TEXT DEFAULT 'generation';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'entries_origin_check'
    ) THEN
        ALTER TABLE entries
        ADD CONSTRAINT entries_origin_check
        CHECK (origin IN ('generation', 'monitoring', 'manual', 'backfill'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_entries_origin ON entries(origin);

-- COLLECTIONS TABLE: Monitoring configuration
ALTER TABLE collections
ADD COLUMN IF NOT EXISTS monitoring_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE collections
ADD COLUMN IF NOT EXISTS last_monitored_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE collections
ADD COLUMN IF NOT EXISTS monitoring_interval TEXT DEFAULT 'daily';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'collections_monitoring_interval_check'
    ) THEN
        ALTER TABLE collections
        ADD CONSTRAINT collections_monitoring_interval_check
        CHECK (monitoring_interval IN ('hourly', 'daily', 'weekly', 'manual'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_collections_monitoring ON collections(monitoring_enabled, last_monitored_at);

-- PROFILES TABLE: Prominence scoring
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS prominence_score INTEGER DEFAULT 5;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_prominence_score_check'
    ) THEN
        ALTER TABLE profiles
        ADD CONSTRAINT profiles_prominence_score_check
        CHECK (prominence_score >= 1 AND prominence_score <= 10);
    END IF;
END $$;

-- MONITORING_RUNS TABLE: Audit log
CREATE TABLE IF NOT EXISTS monitoring_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    collection_slug TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    events_found INTEGER DEFAULT 0,
    events_published INTEGER DEFAULT 0,
    events_skipped INTEGER DEFAULT 0,
    subjects_checked JSONB,
    error_message TEXT,
    run_log JSONB
);

CREATE INDEX IF NOT EXISTS idx_monitoring_runs_collection ON monitoring_runs(collection_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_runs_status ON monitoring_runs(status, started_at DESC);

-- Enable RLS on monitoring_runs
ALTER TABLE monitoring_runs ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage monitoring_runs
CREATE POLICY "Admins can manage monitoring_runs"
ON monitoring_runs
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Allow collection owners/editors to view their monitoring runs
CREATE POLICY "Collection editors can view their monitoring_runs"
ON monitoring_runs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM collection_roles
        WHERE collection_id = monitoring_runs.collection_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'editor')
    )
);