-- Remove subject_name column from lifelines table
ALTER TABLE public.lifelines DROP COLUMN IF EXISTS subject_name;