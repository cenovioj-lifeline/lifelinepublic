import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { collectionId, collectionSlug } = await req.json();

    if (!collectionId && !collectionSlug) {
      return new Response(
        JSON.stringify({ error: 'Either collectionId or collectionSlug is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Exporting collection data:', { collectionId, collectionSlug });

    // Fetch collection
    let collectionQuery = supabaseClient
      .from('collections')
      .select('*');

    if (collectionId) {
      collectionQuery = collectionQuery.eq('id', collectionId);
    } else {
      collectionQuery = collectionQuery.eq('slug', collectionSlug);
    }

    const { data: collection, error: collectionError } = await collectionQuery.single();

    if (collectionError || !collection) {
      console.error('Collection not found:', collectionError);
      return new Response(
        JSON.stringify({ error: 'Collection not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all lifelines in the collection
    const { data: collectionLifelines, error: clError } = await supabaseClient
      .from('collection_lifelines')
      .select('lifeline_id')
      .eq('collection_id', collection.id);

    if (clError) {
      console.error('Error fetching collection lifelines:', clError);
      throw clError;
    }

    const lifelineIds = (collectionLifelines || []).map(cl => cl.lifeline_id);

    if (lifelineIds.length === 0) {
      return new Response(
        JSON.stringify({
          collection: {
            id: collection.id,
            title: collection.title,
            slug: collection.slug,
            description: collection.description
          },
          lifelines: [],
          metadata: {
            total_lifelines: 0,
            total_entries: 0,
            entries_with_serpapi_query: 0,
            entries_with_images: 0,
            entries_needing_images: 0
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all lifelines with their data
    const { data: lifelines, error: lifelinesError } = await supabaseClient
      .from('lifelines')
      .select('*')
      .in('id', lifelineIds)
      .order('title', { ascending: true });

    if (lifelinesError) {
      console.error('Error fetching lifelines:', lifelinesError);
      throw lifelinesError;
    }

    // Process each lifeline
    const processedLifelines = [];
    let totalEntries = 0;
    let totalEntriesWithQuery = 0;
    let totalEntriesWithImages = 0;
    let totalEntriesNeedingImages = 0;

    for (const lifeline of lifelines || []) {
      // Fetch entries for this lifeline
      const { data: entries, error: entriesError } = await supabaseClient
        .from('entries')
        .select('*')
        .eq('lifeline_id', lifeline.id)
        .order('date_start', { ascending: true });

      if (entriesError) {
        console.error(`Error fetching entries for lifeline ${lifeline.id}:`, entriesError);
        continue;
      }

      // Process each entry to get image data
      const processedEntries = [];
      let entriesWithQuery = 0;
      let entriesWithImages = 0;
      let entriesNeedingImages = 0;

      for (const entry of entries || []) {
        // Fetch images via entry_media and media_assets
        const { data: entryMedia, error: mediaError } = await supabaseClient
          .from('entry_media')
          .select(`
            id,
            order_index,
            position_x,
            position_y,
            scale,
            locked,
            media_assets (
              id,
              url,
              alt_text,
              mime_type
            )
          `)
          .eq('entry_id', entry.id)
          .order('order_index', { ascending: true });

        const existingImages = (entryMedia || []).map(em => {
          const mediaAsset = Array.isArray(em.media_assets) ? em.media_assets[0] : em.media_assets;
          return {
            entryMediaId: em.id,
            mediaId: mediaAsset?.id,
            url: mediaAsset?.url,
            altText: mediaAsset?.alt_text,
            mimeType: mediaAsset?.mime_type,
            orderIndex: em.order_index,
            position: {
              x: em.position_x,
              y: em.position_y,
              scale: em.scale
            },
            locked: em.locked
          };
        });

        const hasLockedImages = existingImages.some(img => img.locked);
        const hasImages = existingImages.length > 0;
        const hasSerpApiQuery = !!entry.serpapi_query;

        if (hasSerpApiQuery) entriesWithQuery++;
        if (hasImages) entriesWithImages++;
        if (hasSerpApiQuery && !hasImages && !hasLockedImages) entriesNeedingImages++;

        processedEntries.push({
          id: entry.id,
          title: entry.title,
          description: entry.description,
          date_start: entry.date_start,
          date_end: entry.date_end,
          serpapi_query: entry.serpapi_query,
          has_images: hasImages,
          has_locked_images: hasLockedImages,
          existing_images: existingImages
        });
      }

      totalEntries += entries?.length || 0;
      totalEntriesWithQuery += entriesWithQuery;
      totalEntriesWithImages += entriesWithImages;
      totalEntriesNeedingImages += entriesNeedingImages;

      processedLifelines.push({
        lifeline: {
          id: lifeline.id,
          title: lifeline.title,
          slug: lifeline.slug,
          subject: lifeline.subject,
          intro: lifeline.intro
        },
        entries: processedEntries,
        stats: {
          total_entries: entries?.length || 0,
          entries_with_serpapi_query: entriesWithQuery,
          entries_with_images: entriesWithImages,
          entries_needing_images: entriesNeedingImages
        }
      });
    }

    // Prepare response
    const response = {
      collection: {
        id: collection.id,
        title: collection.title,
        slug: collection.slug,
        description: collection.description
      },
      lifelines: processedLifelines,
      metadata: {
        total_lifelines: lifelines?.length || 0,
        total_entries: totalEntries,
        entries_with_serpapi_query: totalEntriesWithQuery,
        entries_with_images: totalEntriesWithImages,
        entries_needing_images: totalEntriesNeedingImages,
        exported_at: new Date().toISOString()
      }
    };

    console.log('Export complete:', {
      lifelines: processedLifelines.length,
      entries: totalEntries,
      needing_images: totalEntriesNeedingImages
    });

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in export-collection-data function:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
