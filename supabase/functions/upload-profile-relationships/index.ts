import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders } from '../_shared/cors.ts';

interface RelationshipData {
  source_profile_slug: string;
  target_name: string;
  relationship_type: string;
  relationship_category?: string;
  context?: string;
}

interface RelationshipResponse {
  source_profile_slug: string;
  target_name: string;
  status: 'created' | 'failed';
  relationship_id?: string;
  target_resolved: boolean;
  message: string;
}

interface PendingResolution {
  relationship_id: string;
  source_profile_slug: string;
  target_name: string;
  note: string;
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
    const { relationships } = await req.json();

    if (!relationships || !Array.isArray(relationships)) {
      return new Response(
        JSON.stringify({ error: 'Request body must contain a "relationships" array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (relationships.length === 0 || relationships.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Relationships array must contain 1-100 items' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results: RelationshipResponse[] = [];
    const pendingResolutions: PendingResolution[] = [];
    let created = 0;
    let failed = 0;
    let pendingResolutionCount = 0;

    // Process each relationship
    for (const relationship of relationships) {
      try {
        // Validate required fields
        if (!relationship.source_profile_slug || !relationship.target_name || !relationship.relationship_type) {
          results.push({
            source_profile_slug: relationship.source_profile_slug || 'unknown',
            target_name: relationship.target_name || 'unknown',
            status: 'failed',
            target_resolved: false,
            message: 'Missing required fields: source_profile_slug, target_name, relationship_type'
          });
          failed++;
          continue;
        }

        // Look up source profile by slug (MUST exist)
        const { data: sourceProfile, error: sourceError } = await supabase
          .from('profiles')
          .select('id, slug')
          .eq('slug', relationship.source_profile_slug)
          .single();

        if (sourceError || !sourceProfile) {
          results.push({
            source_profile_slug: relationship.source_profile_slug,
            target_name: relationship.target_name,
            status: 'failed',
            target_resolved: false,
            message: `Source profile not found with slug: ${relationship.source_profile_slug}`
          });
          failed++;
          continue;
        }

        // Try to look up target profile by name (OK if doesn't exist)
        // Try matching by slug first (convert name to slug format), then by exact name match
        const slugifiedTarget = relationship.target_name.toLowerCase().replace(/\s+/g, '-');
        
        const { data: targetProfile } = await supabase
          .from('profiles')
          .select('id, name')
          .or(`slug.eq.${slugifiedTarget},name.ilike.${relationship.target_name}`)
          .maybeSingle();

        // Insert relationship
        const relationshipData = {
          profile_id: sourceProfile.id,
          related_profile_id: targetProfile?.id || null,
          target_name: relationship.target_name,
          relationship_type: relationship.relationship_type,
          context: relationship.context || null
        };

        const { data: newRelationship, error: insertError } = await supabase
          .from('profile_relationships')
          .insert(relationshipData)
          .select('id')
          .single();

        if (insertError) {
          console.error(`Error creating relationship for ${relationship.source_profile_slug}:`, insertError);
          results.push({
            source_profile_slug: relationship.source_profile_slug,
            target_name: relationship.target_name,
            status: 'failed',
            target_resolved: false,
            message: `Database error: ${insertError.message}`
          });
          failed++;
          continue;
        }

        const isResolved = !!targetProfile;
        
        if (!isResolved) {
          pendingResolutions.push({
            relationship_id: newRelationship.id,
            source_profile_slug: relationship.source_profile_slug,
            target_name: relationship.target_name,
            note: `Target profile not found - will be resolved when '${relationship.target_name}' profile is created`
          });
          pendingResolutionCount++;
        }

        results.push({
          source_profile_slug: relationship.source_profile_slug,
          target_name: relationship.target_name,
          status: 'created',
          relationship_id: newRelationship.id,
          target_resolved: isResolved,
          message: isResolved 
            ? 'Relationship created successfully'
            : 'Relationship created (target pending resolution)'
        });
        created++;

      } catch (error) {
        console.error(`Error processing relationship:`, error);
        results.push({
          source_profile_slug: relationship.source_profile_slug || 'unknown',
          target_name: relationship.target_name || 'unknown',
          status: 'failed',
          target_resolved: false,
          message: `Processing error: ${error instanceof Error ? error.message : String(error)}`
        });
        failed++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: relationships.length,
          created,
          failed,
          pending_resolution: pendingResolutionCount
        },
        results,
        pending_resolutions: pendingResolutions
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in upload-profile-relationships function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
