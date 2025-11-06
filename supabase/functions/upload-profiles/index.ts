import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders } from '../_shared/cors.ts';

interface ProfileData {
  name: string;
  slug: string;
  subject_type: string;
  reality_status: string;
  subject_status?: string;
  short_description: string;
  known_for?: string;
  tags?: string;
  status?: string;
  birth_date?: string;
  death_date?: string;
  birth_place?: string;
  death_place?: string;
  nationality?: string;
  occupation?: string;
  affiliations?: string;
  height?: string;
  weight?: string;
  build?: string;
  distinguishing_features?: string;
  signature_items?: string;
  powers_abilities?: string;
  condition?: string;
  why_notable?: string;
  creators?: string;
  universe?: string;
  portrayed_by?: string;
  first_appearance?: string;
  last_appearance?: string;
  origin?: string;
  species?: string;
  character_arc_summary?: string;
  historical_significance?: string;
  cultural_impact?: string;
  major_accomplishments?: string;
  controversies?: string;
  awards_honors?: string;
  style_genre?: string;
  major_themes?: string;
  career_span?: string;
  founded_date?: string;
  dissolved_date?: string;
  headquarters?: string;
  mission_purpose?: string;
  current_status?: string;
  key_achievements?: string;
}

interface ProfileResponse {
  slug: string;
  status: 'created' | 'skipped' | 'failed';
  profile_id?: string;
  message: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate Authorization header
    const authHeader = req.headers.get('Authorization');
    const expectedKey = Deno.env.get('PROFILE_UPLOAD_API_KEY');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const providedKey = authHeader.replace('Bearer ', '');
    if (providedKey !== expectedKey) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { profiles } = await req.json();

    if (!profiles || !Array.isArray(profiles)) {
      return new Response(
        JSON.stringify({ error: 'Request body must contain a "profiles" array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (profiles.length === 0 || profiles.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Profiles array must contain 1-100 items' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results: ProfileResponse[] = [];
    let created = 0;
    let skipped = 0;
    let failed = 0;

    // Helper function to split pipe-separated values
    const splitPipes = (value: string | undefined): string[] => {
      if (!value) return [];
      return value.split('|').map(v => v.trim()).filter(v => v.length > 0);
    };

    // Process each profile
    for (const profile of profiles) {
      try {
        // Validate required fields
        if (!profile.name || !profile.slug || !profile.subject_type || !profile.reality_status || !profile.short_description) {
          results.push({
            slug: profile.slug || 'unknown',
            status: 'failed',
            message: 'Missing required fields: name, slug, subject_type, reality_status, short_description'
          });
          failed++;
          continue;
        }

        // Check if profile with this slug already exists
        const { data: existing } = await supabase
          .from('profiles')
          .select('id, slug')
          .eq('slug', profile.slug)
          .single();

        if (existing) {
          results.push({
            slug: profile.slug,
            status: 'skipped',
            profile_id: existing.id,
            message: 'Profile with this slug already exists'
          });
          skipped++;
          continue;
        }

        // Build extended_data JSONB structure
        const extendedData: any = {
          biographical: {},
          physical: {},
          fictional: {},
          legacy: {},
          creative_works: {},
          organization: {}
        };

        // Map biographical data
        if (profile.birth_date) extendedData.biographical.birth_date = profile.birth_date;
        if (profile.death_date) extendedData.biographical.death_date = profile.death_date;
        if (profile.birth_place) extendedData.biographical.birth_place = profile.birth_place;
        if (profile.death_place) extendedData.biographical.death_place = profile.death_place;
        if (profile.nationality) extendedData.biographical.nationality = splitPipes(profile.nationality);
        if (profile.occupation) extendedData.biographical.occupation = splitPipes(profile.occupation);
        if (profile.affiliations) extendedData.biographical.affiliations = splitPipes(profile.affiliations);

        // Map physical data
        if (profile.height) extendedData.physical.height = profile.height;
        if (profile.weight) extendedData.physical.weight = profile.weight;
        if (profile.build) extendedData.physical.build = profile.build;
        if (profile.distinguishing_features) extendedData.physical.distinguishing_features = splitPipes(profile.distinguishing_features);
        if (profile.signature_items) extendedData.physical.signature_items = splitPipes(profile.signature_items);
        if (profile.powers_abilities) extendedData.physical.powers_abilities = splitPipes(profile.powers_abilities);
        if (profile.condition) extendedData.physical.condition = profile.condition;
        if (profile.why_notable) extendedData.physical.why_notable = profile.why_notable;

        // Map fictional data
        if (profile.creators) extendedData.fictional.creators = profile.creators;
        if (profile.universe) extendedData.fictional.universe = profile.universe;
        if (profile.portrayed_by) extendedData.fictional.portrayed_by = profile.portrayed_by;
        if (profile.first_appearance) extendedData.fictional.first_appearance = profile.first_appearance;
        if (profile.last_appearance) extendedData.fictional.last_appearance = profile.last_appearance;
        if (profile.origin) extendedData.fictional.origin = profile.origin;
        if (profile.species) extendedData.fictional.species = profile.species;
        if (profile.character_arc_summary) extendedData.fictional.character_arc_summary = profile.character_arc_summary;

        // Map legacy data
        if (profile.historical_significance) extendedData.legacy.historical_significance = profile.historical_significance;
        if (profile.cultural_impact) extendedData.legacy.cultural_impact = profile.cultural_impact;
        if (profile.major_accomplishments) extendedData.legacy.major_accomplishments = splitPipes(profile.major_accomplishments);
        if (profile.controversies) extendedData.legacy.controversies = splitPipes(profile.controversies);
        if (profile.awards_honors) extendedData.legacy.awards_honors = splitPipes(profile.awards_honors);

        // Map creative works data
        if (profile.style_genre) extendedData.creative_works.style_genre = profile.style_genre;
        if (profile.major_themes) extendedData.creative_works.major_themes = splitPipes(profile.major_themes);
        if (profile.career_span) extendedData.creative_works.career_span = profile.career_span;

        // Map organization data
        if (profile.founded_date) extendedData.organization.founded_date = profile.founded_date;
        if (profile.dissolved_date) extendedData.organization.dissolved_date = profile.dissolved_date;
        if (profile.headquarters) extendedData.organization.headquarters = profile.headquarters;
        if (profile.mission_purpose) extendedData.organization.mission_purpose = profile.mission_purpose;
        if (profile.current_status) extendedData.organization.current_status = profile.current_status;
        if (profile.key_achievements) extendedData.organization.key_achievements = splitPipes(profile.key_achievements);

        // Prepare profile data for insertion
        const profileData = {
          name: profile.name,
          slug: profile.slug,
          subject_type: profile.subject_type,
          reality_status: profile.reality_status,
          subject_status: profile.subject_status || null,
          short_description: profile.short_description,
          known_for: splitPipes(profile.known_for),
          tags: splitPipes(profile.tags),
          status: profile.status || 'draft',
          extended_data: extendedData
        };

        // Insert profile
        const { data: newProfile, error } = await supabase
          .from('profiles')
          .insert(profileData)
          .select('id, slug')
          .single();

        if (error) {
          console.error(`Error creating profile ${profile.slug}:`, error);
          results.push({
            slug: profile.slug,
            status: 'failed',
            message: `Database error: ${error.message}`
          });
          failed++;
          continue;
        }

        results.push({
          slug: profile.slug,
          status: 'created',
          profile_id: newProfile.id,
          message: 'Profile created successfully'
        });
        created++;

      } catch (error) {
        console.error(`Error processing profile ${profile.slug}:`, error);
        results.push({
          slug: profile.slug || 'unknown',
          status: 'failed',
          message: `Processing error: ${error instanceof Error ? error.message : String(error)}`
        });
        failed++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: profiles.length,
          created,
          skipped,
          failed
        },
        results
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in upload-profiles function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
