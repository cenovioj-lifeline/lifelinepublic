-- Remove old reality_status constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_reality_status_check;

-- Update existing data to lowercase values
UPDATE profiles SET reality_status = 'fictional' WHERE reality_status = 'Fictional';
UPDATE profiles SET reality_status = 'real' WHERE reality_status = 'Real';
UPDATE profiles SET reality_status = 'mythological' WHERE reality_status = 'Mythological';
UPDATE profiles SET reality_status = 'historical_fiction' WHERE reality_status = 'Disputed/Legendary';

-- Add new constraint with lowercase values
ALTER TABLE profiles ADD CONSTRAINT profiles_reality_status_check 
CHECK (reality_status IN ('real', 'fictional', 'mythological', 'historical_fiction'));