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

// Extract context cues from event text based on v3 guide with strict deny-list enforcement
function extractContextCues(eventTitle: string, eventDetails: string): string[] {
  const text = `${eventTitle} ${eventDetails}`.toLowerCase();
  const originalText = `${eventTitle} ${eventDetails}`;
  const cues: string[] = [];
  
  // HARD BLOCK: Deny-list (never add unless explicitly present as exact phrase)
  const denyList = ['romance', 'lover', 'intimate moment'];
  const hasExplicitRomance = text.includes('kiss') || text.includes('affair') || text.includes('romantic');

  // Priority 1: Fantasy-specific proper nouns and scene anchors (extract first)
  const fantasyAnchors: { [key: string]: string[] } = {
    'three-eyed raven': ['Three-Eyed Raven', 'visions', 'weirwood'],
    'children of the forest': ['Children of the Forest', 'cave', 'weirwood'],
    'night king': ['Night King', 'wights', 'battle'],
    'warg': ['warging', 'ravens', 'wolves', 'greenseer'],
    'greenseer': ['greenseer', 'visions', 'weirwood'],
    'hodor': ['Hodor', 'hold the door'],
    'jojen': ['Jojen Reed', 'greenseer'],
    'meera': ['Meera Reed'],
    "craster's keep": ["Craster's Keep", "Night's Watch", "mutineers"],
    'tower of joy': ['Tower of Joy', 'Lyanna', 'Rhaegar'],
    'valyrian steel': ['Valyrian steel dagger'],
    'dragonpit': ['Dragonpit', 'council'],
    'winterfell': ['Winterfell'],
    'godswood': ['godswood', 'weirwood'],
    'battle of winterfell': ['Battle of Winterfell', 'Night King'],
  };

  // Extract fantasy anchors first (priority)
  for (const [key, anchors] of Object.entries(fantasyAnchors)) {
    if (text.includes(key)) {
      cues.push(...anchors);
    }
  }

  // Extract character names as proper nouns
  const characterNames = ['Arya', 'Sansa', 'Jon Snow', 'Tyrion', 'Cersei', 'Jaime', 'Rhaegar', 'Lyanna'];
  for (const name of characterNames) {
    if (originalText.includes(name)) {
      cues.push(name);
    }
  }

  // Priority 2: Theme-based cues (only if no fantasy anchors matched strongly)
  const strongFantasyMatch = cues.length >= 2;
  
  if (!strongFantasyMatch) {
    // Magic/power/vision (avoid if already have fantasy anchors)
    if (/vision|prophecy|magic|dream|power/.test(text) && !text.includes('warg')) {
      cues.push('visions', 'magic', 'weirwood');
    }
    
    // Combat/duel/fight/trial (only if NOT warging/visions)
    if (/trial|combat|fight|duel|battle/.test(text) && !text.includes('warg') && !text.includes('vision')) {
      cues.push('battle scene', 'weapon');
    }
    
    // Injury/death/fall/poison
    if (/\b(fall|push|killed|wounded|poisoned|death)\b/.test(text)) {
      if (text.includes('fall') || text.includes('push')) {
        cues.push('falling', 'pushed');
      } else {
        cues.push('death scene');
      }
    }
    
    // Politics/royalty/court (only for actual council/election scenes)
    if (/(elected|council|vote|coronation)/.test(text)) {
      cues.push('council', 'Dragonpit', 'vote');
    } else if (/\b(king|queen|throne)\b/.test(text) && !text.includes('night king')) {
      cues.push('throne room');
    }
    
    // Travel/discovery
    if (/journey|travel|beyond|trek|snow/.test(text)) {
      cues.push('journey', 'traveling', 'snow');
    }
    
    // Meeting/reunion
    if (/meeting|reunion|return/.test(text)) {
      cues.push('reunion', 'meeting');
    }
    
    // Gifting/giving
    if (/giving|gift|dagger/.test(text)) {
      cues.push('gifting');
    }
  }

  // Priority 3: Extract additional proper nouns from event text as anchors
  const properNounPatterns = [
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g, // Capitalized words
  ];
  
  for (const pattern of properNounPatterns) {
    const matches = originalText.match(pattern);
    if (matches) {
      for (const match of matches) {
        // Skip common words and already added terms
        if (match.length > 2 && !['The', 'His', 'Her', 'Their', 'During', 'After', 'Before'].includes(match)) {
          const lower = match.toLowerCase();
          if (!cues.some(c => c.toLowerCase().includes(lower))) {
            cues.push(match);
          }
        }
      }
    }
  }

  // CRITICAL: Remove deny-list terms UNLESS explicitly present
  const filtered = cues.filter(cue => {
    const lower = cue.toLowerCase();
    if (denyList.includes(lower)) {
      return hasExplicitRomance;
    }
    return true;
  });

  // Ensure uniqueness
  return [...new Set(filtered)];
}

// Build query variants following v3 guide for Person lifelines
function buildQueries(
  entry: Entry, 
  characterName?: string, 
  collectionTitle?: string,
  actorName?: string
): string[] {
  const queries: string[] = [];
  
  // Step 1: Build base subject string (always include character + collection)
  const subjectParts: string[] = [];
  if (characterName) subjectParts.push(characterName);
  if (collectionTitle) subjectParts.push(collectionTitle);
  if (actorName) subjectParts.push(actorName); // Optional fallback
  
  const subject = subjectParts.join(" ");
  
  if (!subject.trim()) {
    return []; // Can't build queries without a subject
  }
  
  // Step 2: Extract context cues from event (using v3 cue dictionary with proper noun extraction)
  const contextCues = extractContextCues(entry.title, entry.summary || entry.details || '');
  
  console.log(`  Extracted ${contextCues.length} cues: ${contextCues.slice(0, 8).join(', ')}`);
  
  // Step 3: Build the 3 variants per v3 guide
  // REQUIREMENT: Need ≥2 event-specific anchors for meaningful queries
  
  if (contextCues.length < 2) {
    console.log(`  WARNING: Only ${contextCues.length} cues extracted, query may be too generic`);
  }
  
  // Variant 1: Broad (subject + up to 6 best cues + "scene still")
  if (contextCues.length >= 2) {
    const broadCues = contextCues.slice(0, 6).join(" ");
    queries.push(`${subject} ${broadCues} scene still`);
  } else if (contextCues.length === 1) {
    queries.push(`${subject} ${contextCues[0]} scene still`);
  } else {
    // Last resort fallback
    queries.push(`${subject} ${entry.title} scene still`);
  }
  
  // Variant 2: Context-focused (subject + 2-3 strongest cues + "scene still")
  if (contextCues.length >= 3) {
    queries.push(`${subject} ${contextCues[0]} ${contextCues[1]} ${contextCues[2]} scene still`);
  } else if (contextCues.length === 2) {
    queries.push(`${subject} ${contextCues[0]} ${contextCues[1]} scene still`);
  }
  
  // Variant 3: Domain-biased (subject + 2-3 strongest cues + site filters)
  if (contextCues.length >= 3) {
    const domains = "site:hbo.com OR site:imdb.com OR site:gameofthrones.fandom.com";
    queries.push(`${subject} ${contextCues[0]} ${contextCues[1]} ${contextCues[2]} ${domains}`);
  } else if (contextCues.length === 2) {
    const domains = "site:hbo.com OR site:imdb.com OR site:gameofthrones.fandom.com";
    queries.push(`${subject} ${contextCues[0]} ${contextCues[1]} ${domains}`);
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
