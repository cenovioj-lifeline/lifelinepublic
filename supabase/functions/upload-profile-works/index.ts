import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders } from '../_shared/cors.ts';

interface WorkData {
  profile_slug: string;
  work_category: string;
  title: string;
  year?: string;
  work_type?: string;
  significance?: string;
  additional_info?: Record<string, any>;
}

interface WorkResponse {
  title: string;
  profile_slug: string;
  status: 'created' | 'failed';
  work_id?: string;
  message: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate Authorization header
    const authHeader = req.headers.get('Authorization');
    const expectedKey = Deno.env.get('LOVABLE_API_KEY');

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
    const { works } = await req.json();

    if (!works || !Array.isArray(works)) {
      return new Response(
        JSON.stringify({ error: 'Request body must contain a "works" array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (works.length === 0 || works.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Works array must contain 1-100 items' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results: WorkResponse[] = [];
    let created = 0;
    let failed = 0;

    // Process each work
    for (const work of works) {
      try {
        // Validate required fields
        if (!work.profile_slug || !work.work_category || !work.title) {
          results.push({
            title: work.title || 'unknown',
            profile_slug: work.profile_slug || 'unknown',
            status: 'failed',
            message: 'Missing required fields: profile_slug, work_category, title'
          });
          failed++;
          continue;
        }

        // Look up profile by slug
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('slug', work.profile_slug)
          .single();

        if (profileError || !profile) {
          results.push({
            title: work.title,
            profile_slug: work.profile_slug,
            status: 'failed',
            message: `Profile not found with slug: ${work.profile_slug}`
          });
          failed++;
          continue;
        }

        // Insert work
        const { data: newWork, error: insertError } = await supabase
          .from('profile_works')
          .insert({
            profile_id: profile.id,
            work_category: work.work_category,
            title: work.title,
            year: work.year || null,
            work_type: work.work_type || null,
            significance: work.significance || null,
            additional_info: work.additional_info || {}
          })
          .select('id')
          .single();

        if (insertError) {
          console.error(`Error creating work ${work.title}:`, insertError);
          results.push({
            title: work.title,
            profile_slug: work.profile_slug,
            status: 'failed',
            message: `Database error: ${insertError.message}`
          });
          failed++;
          continue;
        }

        results.push({
          title: work.title,
          profile_slug: work.profile_slug,
          status: 'created',
          work_id: newWork.id,
          message: 'Work created successfully'
        });
        created++;

      } catch (error) {
        console.error(`Error processing work ${work.title}:`, error);
        results.push({
          title: work.title || 'unknown',
          profile_slug: work.profile_slug || 'unknown',
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
          total: works.length,
          created,
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
    console.error('Error in upload-profile-works function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
