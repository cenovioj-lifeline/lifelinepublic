-- Fix relationship type for personal lifeline so it shows in "My Lifeline" section on profile
UPDATE profile_lifelines
SET relationship_type = 'subject'
WHERE lifeline_id = '600e1098-69fa-43e2-a03d-9c4e4640f424'
  AND profile_id = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';