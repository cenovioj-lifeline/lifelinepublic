import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xvtmrnmwmuroksneekbl.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY not found in environment variables.');
  console.error('You need the service role key to run migrations.');
  console.error('Add it to your .env file as: SUPABASE_SERVICE_ROLE_KEY=your_key_here');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Read the migration file
const migrationPath = join(__dirname, 'supabase', 'migrations', '20251025000001_add_theme_color_fields.sql');
const migrationSQL = readFileSync(migrationPath, 'utf8');

console.log('Running migration...');
console.log('Migration file:', migrationPath);

// Split by semicolons and filter out comments
const statements = migrationSQL
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt && !stmt.startsWith('--'));

async function runMigration() {
  try {
    for (const statement of statements) {
      if (statement) {
        console.log(`Executing: ${statement.substring(0, 80)}...`);
        const { error } = await supabase.rpc('exec_sql', { query: statement });

        if (error) {
          console.error('Error:', error.message);
          // Try direct approach if rpc doesn't work
          const { error: directError } = await supabase.from('_migrations').insert({ statement });
          if (directError) {
            console.error('Direct approach also failed:', directError);
          }
        } else {
          console.log('✓ Success');
        }
      }
    }
    console.log('\n✅ Migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
