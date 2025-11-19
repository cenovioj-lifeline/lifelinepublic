
-- Add the new check constraint with standardized values
ALTER TABLE profiles ADD CONSTRAINT profiles_subject_type_check 
CHECK (subject_type IN ('person_real', 'person_fictional', 'entity', 'organization'));
