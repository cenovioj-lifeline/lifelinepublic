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

interface ImageResult {
  original: string;
  title?: string;
  source?: string;
  displayed_link?: string;
  original_width?: number;
  original_height?: number;
}

// Extract context cues from event text based on keyword families
function extractContextCues(eventTitle: string, eventDetails: string): string[] {
  const text = `${eventTitle} ${eventDetails}`.toLowerCase();
  const cues: string[] = [];

  // Combat/fight keywords
  if (/combat|duel|fight|trial|battle|arena/.test(text)) {
    cues.push("trial by combat", "duel", "arena", "spear", "battle");
  }
  
  // Love/romance keywords
  if (/love|affair|romance|lover|intimate/.test(text)) {
    cues.push("romance", "lover", "intimate moment");
  }
  
  // Death keywords
  if (/death|killed|poison|wound|dying|murder/.test(text)) {
    cues.push("death scene", "final moments");
  }
  
  // Court/politics keywords
  if (/court|politics|king|queen|throne|council/.test(text)) {
    cues.push("throne room", "council");
  }
  
  // Travel/meeting keywords
  if (/travel|arrival|meeting|came to/.test(text)) {
    cues.push("meeting", "council room");
  }
  
  // Celebration keywords
  if (/celebration|feast|party|wedding|banquet/.test(text)) {
    cues.push("banquet", "feast");
  }
  
  // Betrayal/revenge keywords
  if (/betrayal|revenge|vengeance/.test(text)) {
    cues.push("betrayal", "revenge scene");
  }
  
  // Conversation keywords
  if (/conversation|confession|spoke|said/.test(text)) {
    cues.push("conversation", "confession", "close up");
  }

  return cues;
}

// Build query variants following the new SerpAPI guide for Person lifelines
function buildQueries(
  entry: Entry, 
  characterName?: string, 
  collectionTitle?: string,
  actorName?: string
): string[] {
  const queries: string[] = [];
  
  // Step 1: Build base subject string
  const subjectParts: string[] = [];
  if (characterName) subjectParts.push(characterName);
  if (collectionTitle) subjectParts.push(collectionTitle);
  if (actorName) subjectParts.push(actorName);
  
  const subject = subjectParts.join(" ");
  
  // Step 2: Extract context cues from event
  const contextCues = extractContextCues(entry.title, entry.summary || entry.details || '');
  
  // Always add generic visual cues
  const visualCues = ["scene", "still", "screenshot", "episode photo"];
  
  // Step 3: Build the 3 variants
  
  // Variant 1: Broad (subject + context cues + visual cues)
  const broadCues = [...contextCues.slice(0, 5), ...visualCues.slice(0, 2)];
  queries.push(`${subject} ${broadCues.join(" ")}`);
  
  // Variant 2: Context-focused (subject + 2 strongest cues + scene still)
  if (contextCues.length > 0) {
    queries.push(`${subject} ${contextCues.slice(0, 2).join(" ")} scene still`);
  }
  
  // Variant 3: Domain-biased (subject + 2 strongest cues + domain filters)
  if (contextCues.length > 0 && collectionTitle) {
    const domains = "site:hbo.com OR site:imdb.com OR site:fandom.com";
    queries.push(`${subject} ${contextCues.slice(0, 2).join(" ")} ${domains}`);
  }
  
  return queries.filter(q => q.trim().length > 0);
}

// Score an image based on quality signals
function scoreImage(
  img: ImageResult, 
  characterName?: string, 
  showTitle?: string
): number {
  const title = (img.title || "").toLowerCase();
  const source = (img.source || img.displayed_link || "").toLowerCase();
  const width = img.original_width || 0;
  const height = img.original_height || 0;
  const aspectRatio = width && height ? width / height : 0;

  let score = 0;

  // Subject match boosts
  if (characterName && title.includes(characterName.toLowerCase())) score += 30;
  if (showTitle && title.includes(showTitle.toLowerCase())) score += 20;

  // Domain trust
  const goodDomains = ["amc", "imdb", "fandom", "hbo", "vanityfair", "esquire", "vulture", "nytimes"];
  if (goodDomains.some(d => source.includes(d))) score += 15;

  // Resolution quality
  if (width >= 1200 && height >= 700) score += 15;
  else if (width >= 800 && height >= 500) score += 8;

  // Aspect ratio sanity (landscape-ish)
  if (aspectRatio >= 1.3 && aspectRatio <= 2.0) score += 5;

  // Penalize weak sources
  const weakDomains = ["pinterest", "aliexpress", "shutterstock", "instagram"];
  if (weakDomains.some(d => source.includes(d))) score -= 15;

  return score;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lifelineId, dryRun } = await req.json();
    console.log('Processing lifeline:', lifelineId, 'Dry run:', dryRun);

    if (!lifelineId) {
      return new Response(
        JSON.stringify({ error: 'lifelineId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch lifeline metadata to get character name, collection, etc.
    const { data: lifeline, error: lifelineError } = await supabase
      .from('lifelines')
      .select('title, subject, lifeline_type, collection_id, collections(title)')
      .eq('id', lifelineId)
      .single();

    if (lifelineError) {
      console.error('Error fetching lifeline:', lifelineError);
      throw lifelineError;
    }

    // Extract metadata
    const characterName = lifeline?.subject || lifeline?.title || '';
    const collectionTitle = (lifeline?.collections as any)?.title || '';
    const lifelineType = lifeline?.lifeline_type || '';
    const actorName = ''; // Actor name would need to come from profile table

    console.log(`Lifeline metadata - Character: ${characterName}, Collection: ${collectionTitle}, Type: ${lifelineType}`);

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
    const entriesToProcess = dryRun ? entries : entries.filter(e => !entriesWithMedia.has(e.id));

    console.log(`Total entries: ${entries.length}, Already have images: ${entriesWithMedia.size}, To process: ${entriesToProcess.length}`);

    if (!dryRun && entriesToProcess.length === 0) {
      return new Response(
        JSON.stringify({ message: 'All entries already have images', processed: 0, imported: 0, skipped: entries.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let imported = 0;
    let failed = 0;
    const results = [];
    const queryPreview: Array<{ entryTitle: string; queries: string[] }> = [];

    // Process each entry
    for (const entry of entriesToProcess) {
      try {
        console.log(`Processing entry: ${entry.title}`);
        
        // Build queries using lifeline metadata
        const queries = buildQueries(entry, characterName, collectionTitle, actorName);
        console.log(`Built ${queries.length} query variants for "${entry.title}"`);
        
        // If dry run, just collect queries and continue
        if (dryRun) {
          queryPreview.push({
            entryTitle: entry.title,
            queries: queries
          });
          continue;
        }
        
        // === ACTUAL IMAGE SEARCH AND IMPORT ===
        const serpApiKey = Deno.env.get('SERPAPI_KEY');
        if (!serpApiKey) {
          console.error('SERPAPI_KEY not found');
          failed++;
          results.push({ entryId: entry.id, title: entry.title, success: false, error: 'API key not configured' });
          continue;
        }

        // Collect images from all query variants
        const seenUrls = new Set<string>();
        const allImages: Array<ImageResult & { _score: number }> = [];

        for (const searchQuery of queries) {
          console.log(`  Query: ${searchQuery}`);
          
          // Search for images using SerpAPI Google Images with optimized parameters
          const serpApiUrl = new URL('https://serpapi.com/search.json');
          serpApiUrl.searchParams.set('engine', 'google_images');
          serpApiUrl.searchParams.set('q', searchQuery);
          serpApiUrl.searchParams.set('api_key', serpApiKey);
          serpApiUrl.searchParams.set('hl', 'en');
          serpApiUrl.searchParams.set('gl', 'us');
          serpApiUrl.searchParams.set('tbs', 'itp:photos,isz:l'); // Photos, large size
          serpApiUrl.searchParams.set('num', '10');
          
          const searchResponse = await fetch(serpApiUrl.toString());

          if (!searchResponse.ok) {
            console.error(`  SerpAPI query failed:`, searchResponse.status);
            continue; // Try next query
          }

          const searchData = await searchResponse.json();
          const imageResults = (searchData.images_results || []) as ImageResult[];

          // Score and collect unique images
          for (const img of imageResults) {
            const url = img.original;
            if (!url || seenUrls.has(url)) continue;
            
            seenUrls.add(url);
            const score = scoreImage(img);
            allImages.push({ ...img, _score: score });
          }

          // Early stop if we found a strong candidate
          if (allImages.length > 0) {
            const topScore = Math.max(...allImages.map(img => img._score));
            if (topScore >= 50) {
              console.log(`  Found strong candidate (score: ${topScore}), stopping search`);
              break;
            }
          }

          // Small delay between queries to be respectful
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (allImages.length === 0) {
          console.log(`No images found across all queries for "${entry.title}"`);
          failed++;
          results.push({ entryId: entry.id, title: entry.title, success: false, error: 'No images found' });
          continue;
        }

        // Sort by score and select best image
        allImages.sort((a, b) => b._score - a._score);
        const bestImage = allImages[0];
        const selectedImageUrl = bestImage.original;

        console.log(`Selected best image (score: ${bestImage._score}, ${bestImage.original_width}x${bestImage.original_height}) from: ${bestImage.source || 'unknown source'}`);
        console.log(`  Top 3 scores: ${allImages.slice(0, 3).map(img => img._score).join(', ')}`);

        if (!selectedImageUrl) {
          console.log(`No suitable image URL found for "${entry.title}"`);
          failed++;
          results.push({ entryId: entry.id, title: entry.title, success: false, error: 'No valid image URL' });
          continue;
        }

        // Import the selected best-scored image
        try {
          const importResponse = await supabase.functions.invoke('import-image-from-url', {
            body: {
              entryId: entry.id,
              imageUrl: selectedImageUrl,
              altText: entry.title,
              position: { x: 50, y: 50, scale: 1.0 }
            }
          });

          if (importResponse.error) {
            console.error(`Import failed for "${entry.title}":`, importResponse.error);
            failed++;
            results.push({ entryId: entry.id, title: entry.title, success: false, error: 'Import failed' });
          } else {
            console.log(`Successfully found and imported image for "${entry.title}"`);
            imported++;
            results.push({ 
              entryId: entry.id, 
              title: entry.title, 
              success: true, 
              imageUrl: selectedImageUrl,
              score: bestImage._score 
            });
          }
        } catch (importError) {
          console.error(`Error importing found image:`, importError);
          failed++;
          results.push({ entryId: entry.id, title: entry.title, success: false, error: 'Import error' });
        }

        // Add a delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing entry "${entry.title}":`, error);
        failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.push({ entryId: entry.id, title: entry.title, success: false, error: errorMsg });
      }
    }

    // Return different response based on dry run mode
    if (dryRun) {
      return new Response(
        JSON.stringify({
          message: 'Query preview generated',
          dryRun: true,
          lifeline: {
            characterName,
            collectionTitle,
            actorName,
            type: lifelineType
          },
          queryPreview
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
