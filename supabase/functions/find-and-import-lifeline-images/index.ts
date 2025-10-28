import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Entry {
  id: string;
  title: string;
  summary: string | null;
  details: string | null;
  occurred_on: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lifelineId } = await req.json();
    console.log('Processing lifeline:', lifelineId);

    if (!lifelineId) {
      return new Response(
        JSON.stringify({ error: 'lifelineId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all entries for this lifeline
    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('id, title, summary, details, occurred_on')
      .eq('lifeline_id', lifelineId)
      .order('occurred_on', { ascending: true });

    if (entriesError) {
      console.error('Error fetching entries:', entriesError);
      throw entriesError;
    }

    if (!entries || entries.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No entries found for this lifeline', processed: 0, imported: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check which entries already have images
    const { data: existingMedia, error: mediaError } = await supabase
      .from('entry_media')
      .select('entry_id')
      .in('entry_id', entries.map(e => e.id));

    if (mediaError) {
      console.error('Error checking existing media:', mediaError);
    }

    const entriesWithMedia = new Set(existingMedia?.map(m => m.entry_id) || []);
    const entriesToProcess = entries.filter(e => !entriesWithMedia.has(e.id));

    console.log(`Total entries: ${entries.length}, Already have images: ${entriesWithMedia.size}, To process: ${entriesToProcess.length}`);

    if (entriesToProcess.length === 0) {
      return new Response(
        JSON.stringify({ message: 'All entries already have images', processed: 0, imported: 0, skipped: entries.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let imported = 0;
    let failed = 0;
    const results = [];

    // Process each entry
    for (const entry of entriesToProcess) {
      try {
        console.log(`Processing entry: ${entry.title}`);
        
        // Search for Mad Men images related to this event
        const searchQuery = `Mad Men TV show ${entry.title} ${entry.summary || entry.details || ''}`;
        const searchUrl = `https://search.brave.com/api/search?q=${encodeURIComponent(searchQuery)}&search_type=images`;
        
        const searchResponse = await fetch(searchUrl, {
          headers: {
            'Accept': 'application/json',
          }
        });

        if (!searchResponse.ok) {
          console.error(`Search failed for "${entry.title}":`, searchResponse.status);
          failed++;
          results.push({ entryId: entry.id, title: entry.title, success: false, error: 'Search failed' });
          continue;
        }

        const searchData = await searchResponse.json();
        const images = searchData?.results || [];

        if (images.length === 0) {
          console.log(`No images found for "${entry.title}"`);
          failed++;
          results.push({ entryId: entry.id, title: entry.title, success: false, error: 'No images found' });
          continue;
        }

        // Try to import the first valid image
        let imageImported = false;
        for (const img of images.slice(0, 3)) { // Try up to 3 images
          const imageUrl = img.properties?.url || img.thumbnail?.src;
          if (!imageUrl) continue;

          try {
            // Call the import-image-from-url function
            const importResponse = await fetch(`${supabaseUrl}/functions/v1/import-image-from-url`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                entryId: entry.id,
                imageUrl: imageUrl,
                altText: entry.title,
                position: { x: 50, y: 50, scale: 1.0 }
              })
            });

            if (importResponse.ok) {
              console.log(`Successfully imported image for "${entry.title}"`);
              imported++;
              imageImported = true;
              results.push({ entryId: entry.id, title: entry.title, success: true, imageUrl });
              break;
            } else {
              const errorText = await importResponse.text();
              console.error(`Import failed for image:`, errorText);
            }
          } catch (importError) {
            console.error(`Error importing image:`, importError);
          }
        }

        if (!imageImported) {
          failed++;
          results.push({ entryId: entry.id, title: entry.title, success: false, error: 'Failed to import any images' });
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing entry "${entry.title}":`, error);
        failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.push({ entryId: entry.id, title: entry.title, success: false, error: errorMsg });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${entriesToProcess.length} entries`,
        processed: entriesToProcess.length,
        imported,
        failed,
        skipped: entriesWithMedia.size,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in find-and-import-lifeline-images:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
