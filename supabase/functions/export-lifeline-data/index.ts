import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request parameters
    const { lifelineId, includeImages = false, includeCollection = true } = await req.json();

    // Validate required parameters
    if (!lifelineId) {
      console.error('Missing required parameter: lifelineId');
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: lifelineId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Exporting lifeline data for ID: ${lifelineId}`);
    console.log(`Options: includeImages=${includeImages}, includeCollection=${includeCollection}`);

    // Fetch lifeline data
    const { data: lifeline, error: lifelineError } = await supabase
      .from('lifelines')
      .select('*')
      .eq('id', lifelineId)
      .single();

    if (lifelineError || !lifeline) {
      console.error('Lifeline not found:', lifelineError);
      return new Response(
        JSON.stringify({ error: 'Lifeline not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found lifeline: ${lifeline.title}`);

    // Fetch collection data if requested
    let collectionData = null;
    if (includeCollection && lifeline.collection_id) {
      const { data: collection, error: collectionError } = await supabase
        .from('collections')
        .select('*')
        .eq('id', lifeline.collection_id)
        .single();

      if (!collectionError && collection) {
        collectionData = collection;
        console.log(`Found collection: ${collection.title}`);
      }
    }

    // Fetch all entries for this lifeline
    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('*')
      .eq('lifeline_id', lifelineId)
      .order('occurred_on', { ascending: true });

    if (entriesError) {
      console.error('Error fetching entries:', entriesError);
      return new Response(
        JSON.stringify({ error: 'Error fetching entries' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${entries?.length || 0} entries`);

    // Count entries with serpapi_query
    const entriesWithQuery = entries?.filter(e => e.serpapi_query) || [];
    console.log(`Entries with serpapi_query: ${entriesWithQuery.length}`);

    // Fetch images for each entry if requested
    if (includeImages && entries && entries.length > 0) {
      const entryIds = entries.map(e => e.id);
      const { data: images, error: imagesError } = await supabase
        .from('entry_images')
        .select('*')
        .in('entry_id', entryIds)
        .order('order_index', { ascending: true });

      if (!imagesError && images) {
        // Attach images to their respective entries
        entries.forEach(entry => {
          entry.images = images.filter(img => img.entry_id === entry.id);
        });
        console.log(`Fetched images for entries`);
      }
    }

    // Build response
    const response = {
      lifeline: {
        id: lifeline.id,
        title: lifeline.title,
        slug: lifeline.slug,
        subject: lifeline.subject,
        lifeline_type: lifeline.lifeline_type,
        intro: lifeline.intro,
        conclusion: lifeline.conclusion,
        status: lifeline.status,
        visibility: lifeline.visibility,
        collection_id: lifeline.collection_id,
        birth_year: lifeline.birth_year,
        death_year: lifeline.death_year,
        created_at: lifeline.created_at,
        updated_at: lifeline.updated_at,
      },
      collection: collectionData ? {
        id: collectionData.id,
        title: collectionData.title,
        slug: collectionData.slug,
        description: collectionData.description,
        category: collectionData.category,
      } : null,
      entries: entries?.map(entry => ({
        id: entry.id,
        title: entry.title,
        summary: entry.summary,
        details: entry.details,
        occurred_on: entry.occurred_on,
        age_at_event: entry.age_at_event,
        score: entry.score,
        sentiment: entry.sentiment,
        order_index: entry.order_index,
        serpapi_query: entry.serpapi_query,
        media_suggestion: entry.media_suggestion,
        tags: entry.tags,
        related_lifelines: entry.related_lifelines,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
        ...(includeImages && entry.images ? { images: entry.images } : {}),
      })) || [],
      metadata: {
        total_entries: entries?.length || 0,
        entries_with_serpapi_query: entriesWithQuery.length,
        entries_with_images: includeImages ? entries?.filter(e => e.images && e.images.length > 0).length : null,
        exported_at: new Date().toISOString(),
      },
    };

    console.log(`Export complete. Returning ${response.entries.length} entries`);

    return new Response(
      JSON.stringify(response, null, 2),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
