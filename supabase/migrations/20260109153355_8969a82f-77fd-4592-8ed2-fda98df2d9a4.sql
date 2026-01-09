-- Add chronological_mode column to lifelines table
ALTER TABLE lifelines ADD COLUMN IF NOT EXISTS chronological_mode TEXT DEFAULT 'auto';

-- Add check constraint for chronological_mode
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'lifelines_chronological_mode_check'
    ) THEN
        ALTER TABLE lifelines ADD CONSTRAINT lifelines_chronological_mode_check
            CHECK (chronological_mode IN ('chronological', 'ranked', 'scored', 'auto'));
    END IF;
END $$;

-- Add date_precision column to entries table
ALTER TABLE entries ADD COLUMN IF NOT EXISTS date_precision TEXT;

-- Add check constraint for date_precision
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'entries_date_precision_check'
    ) THEN
        ALTER TABLE entries ADD CONSTRAINT entries_date_precision_check
            CHECK (date_precision IN ('exact', 'day', 'month', 'year', 'approximate') OR date_precision IS NULL);
    END IF;
END $$;

-- Backfill chronological_mode based on lifeline_type
UPDATE lifelines
SET chronological_mode = CASE
    WHEN lifeline_type IN ('person', 'org') THEN 'chronological'
    WHEN lifeline_type = 'rating' THEN 'scored'
    WHEN lifeline_type = 'list' THEN 'ranked'
    ELSE 'auto'
END
WHERE chronological_mode = 'auto' OR chronological_mode IS NULL;

-- Backfill date_precision based on occurred_on patterns
UPDATE entries
SET date_precision = CASE
    WHEN occurred_on IS NULL THEN NULL
    WHEN to_char(occurred_on, 'MM-DD') = '01-01' THEN 'year'
    WHEN to_char(occurred_on, 'DD') = '01' THEN 'month'
    ELSE 'day'
END
WHERE date_precision IS NULL;