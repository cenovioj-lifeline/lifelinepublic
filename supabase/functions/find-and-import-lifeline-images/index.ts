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

// Extract context and mood signals from event text
function extractSignals(eventTitle: string, eventDetails: string) {
  const text = `${eventTitle} ${eventDetails}`.toLowerCase();

  const contextCues: string[] = [];
  if (/\bpartner(ship)?\b/.test(text)) contextCues.push("partners meeting", "partnership", "boardroom");
  if (/\btv\b|\btelevision\b/.test(text)) contextCues.push("TV department", "television");
  if (/\brevenue|profit|money|billings\b/.test(text)) contextCues.push("revenue", "billings");
  if (/\bdenied|passed over|snubbed|overlooked\b/.test(text)) contextCues.push("denied", "passed over");
  if (/\bhierarchy|class|status\b/.test(text)) contextCues.push("hierarchy", "class system");
  if (/\baffair|relationship|romantic|marriage\b/.test(text)) contextCues.push("relationship", "personal");
  if (/\bcalifornia|west coast|travel\b/.test(text)) contextCues.push("California", "travel");

  const moodCues: string[] = [];
  if (/\bresent|resentment|frustrat|bitter|complain|whin/.test(text)) moodCues.push("resentful", "frustrated");
  if (/\bexcluded|not equal|unequal|second-class|marginal/.test(text)) moodCues.push("excluded", "on the margins");
  if (/\bargue|confront|demand|ask\b/.test(text)) moodCues.push("confrontation");
  if (/\bsexist|harass|entitle/.test(text)) moodCues.push("entitled", "problematic");

  // Generic visual anchors that produce useful stills
  const visualCues = ["office scene", "ad agency", "meeting", "still", "screenshot"];

  return { contextCues, moodCues, visualCues };
}

// Build multiple query variants for better results
function buildQueries(entry: Entry, characterName?: string, showTitle?: string): string[] {
  const { contextCues, moodCues, visualCues } = extractSignals(
    entry.title, 
    entry.summary || entry.details || ''
  );

  // Build core subject
  const subjectParts: string[] = [];
  if (characterName) subjectParts.push(characterName);
  if (showTitle) subjectParts.push(showTitle);
  if (subjectParts.length === 0) subjectParts.push(entry.title);
  
  const core = subjectParts.join(" ");

  // Combine all cues (deduplicated)
  const allCues = [...new Set([
    ...contextCues.slice(0, 3),
    ...moodCues.slice(0, 2),
    ...visualCues.slice(0, 2)
  ])].join(" ");

  const queries: string[] = [];

  // Query 1: Broad (core + all cues)
  queries.push(`"${core}" ${allCues}`);

  // Query 2: Context-forward
  if (contextCues.length > 0) {
    queries.push(`"${core}" ${contextCues.slice(0, 3).join(" ")} office scene still`);
  }

  // Query 3: Visual-forward (clean stills)
  queries.push(`"${core}" screenshot still scene`);

  // Query 4: Domain-biased (trusted sources)
  if (showTitle) {
    queries.push(`"${core}" site:amc.com OR site:imdb.com OR site:fandom.com OR site:hbo.com`);
  }

  return queries.filter(Boolean);
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
        
        // === IMAGE SEARCH PROVIDER ===
        // Future: Add provider selection logic here (serpapi, tmdb, thronesapi, etc.)
        // For now, using SerpAPI Google Images search with advanced query building
        
        const serpApiKey = Deno.env.get('SERPAPI_KEY');
        if (!serpApiKey) {
          console.error('SERPAPI_KEY not found');
          failed++;
          results.push({ entryId: entry.id, title: entry.title, success: false, error: 'API key not configured' });
          continue;
        }

        // Extract character/show info if available (could be enhanced with DB lookup)
        // For now, we'll work with entry title as the main subject
        const queries = buildQueries(entry);
        console.log(`Built ${queries.length} query variants for "${entry.title}"`);

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
