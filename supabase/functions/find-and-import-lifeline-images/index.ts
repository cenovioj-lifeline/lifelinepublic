import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { buildSerpQueries, type Inputs } from "./buildSerpQueries.v4.2.ts";

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

// ===== V4.2 IMAGE SEARCH LOGIC =====
// Using universal, franchise-agnostic query builder with proper noun extraction,
// anchor scoring, and auto-detected domain selection.

// Minimal constants needed for QA validation
const PRONOUNS = new Set([
  "she","he","they","them","her","his","hers","its","it's","it","their","theirs","you","your","yours","i","me","my","mine","our","ours"
]);

const DENY = new Set(["romance","lover","intimate moment"]);

// ============================================================
// QA VALIDATION
// ============================================================

interface QAWarning {
  type: 'pronoun_present' | 'duplicate_words' | 'denied_term' | 'missing_character';
  severity: 'error' | 'warning';
  message: string;
  query: string;
}

function validateQuery(
  query: string,
  characterName: string
): QAWarning[] {
  const warnings: QAWarning[] = [];
  const queryLower = query.toLowerCase();
  const tokens = query.split(/\s+/);
  
  // Check 1: Character name present
  if (!queryLower.includes(characterName.toLowerCase())) {
    warnings.push({
      type: 'missing_character',
      severity: 'error',
      message: `Character name "${characterName}" missing from query`,
      query
    });
  }
  
  // Check 2: Pronouns present
  const foundPronouns = tokens.filter(t => PRONOUNS.has(t.toLowerCase()));
  if (foundPronouns.length > 0) {
    warnings.push({
      type: 'pronoun_present',
      severity: 'error',
      message: `Pronouns found: ${foundPronouns.join(', ')}`,
      query
    });
  }
  
  // Check 3: Duplicate words
  const uniqueTokens = new Set(tokens.map(t => t.toLowerCase()));
  if (uniqueTokens.size < tokens.length) {
    const duplicates = tokens.filter((t, i) => 
      tokens.findIndex(t2 => t2.toLowerCase() === t.toLowerCase()) !== i
    );
    warnings.push({
      type: 'duplicate_words',
      severity: 'warning',
      message: `Duplicate words found: ${[...new Set(duplicates)].join(', ')}`,
      query
    });
  }
  
  // Check 4: Denied terms
  const foundDenied = Array.from(DENY).filter(d => queryLower.includes(d));
  if (foundDenied.length > 0) {
    warnings.push({
      type: 'denied_term',
      severity: 'error',
      message: `Denied terms found: ${foundDenied.join(', ')}`,
      query
    });
  }
  
  return warnings;
}

function buildQueries(
  entry: Entry, 
  characterName?: string, 
  collectionTitle?: string,
  actorName?: string,
  collectionDomains?: string[]
): string[] {
  if (!characterName || !collectionTitle) {
    console.log('  WARNING: Missing characterName or collectionTitle, cannot build queries');
    return [];
  }

  // Build queries using v4.2 universal query builder
  const queries = buildSerpQueries({
    characterName,
    collectionTitle,
    eventTitle: entry.title,
    eventDetails: entry.summary || entry.details || '',
    actorName,
    type: "Person",
    collectionDomains
  });

  // Run QA validation and log warnings
  const allQueries = [
    { name: 'Broad', query: queries[0] },
    { name: 'Context', query: queries[1] },
    { name: 'Domain-biased', query: queries[2] }
  ];

  for (const { name, query } of allQueries) {
    const warnings = validateQuery(query, characterName);
    if (warnings.length > 0) {
      console.warn(`⚠️  QA warnings for ${name} query "${entry.title}":`);
      warnings.forEach(w => {
        const icon = w.severity === 'error' ? '❌' : '⚠️';
        console.warn(`  ${icon} [${w.type}] ${w.message}`);
      });
    }
  }

  return queries;
}

// rankResults v4 logic
type ScoredImageResult = ImageResult & { _score: number };

const GOOD_DOMAINS = [
  "hbo.com","imdb.com","fandom.com","vulture.com","vanityfair.com","nytimes.com"
];
const BAD_DOMAINS = ["pinterest.com","shutterstock.com","aliexpress.com"];

function domainOf(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch { return undefined; }
}

function aspectScore(w?: number, h?: number): number {
  if (!w || !h) return 0;
  const r = w / h;
  return r >= 1.3 && r <= 2.0 ? 1 : 0;
}

function scoreImage(
  img: ImageResult,
  characterName?: string,
  collectionTitle?: string
): number {
  const dom = domainOf(img.source || img.displayed_link);
  let score = 0;

  // Domain trust (highest priority)
  if (dom && GOOD_DOMAINS.some(d => dom.endsWith(d))) score += 3;
  if (dom && BAD_DOMAINS.some(d => dom.endsWith(d))) score -= 2;

  // Resolution quality
  if ((img.original_width || 0) >= 1200) score += 2;

  // Title relevance
  const title = (img.title || "").toLowerCase();
  const subjectTokens = [characterName, collectionTitle]
    .filter(Boolean)
    .flatMap(s => s!.split(/\s+/));
  const hitTokens = subjectTokens.filter(t => title.includes(t.toLowerCase())).length;
  score += Math.min(hitTokens, 3);

  // Aspect ratio sanity
  score += aspectScore(img.original_width, img.original_height);

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
            const score = scoreImage(img, characterName, collectionTitle);
            allImages.push({ ...img, _score: score });
          }

          // Early stop if we found a strong candidate (v4 scoring: max ~10)
          if (allImages.length > 0) {
            const topScore = Math.max(...allImages.map(img => img._score));
            if (topScore >= 8) {
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
      // Generate QA report for dry run
      const qaReport = queryPreview.map(preview => {
        return {
          entryTitle: preview.entryTitle,
          queries: preview.queries.map((q, idx) => {
            const type = ['Broad', 'Context', 'Domain-biased'][idx];
            const warnings = validateQuery(q, characterName);
            return {
              type,
              query: q,
              warnings: warnings.map(w => `${w.severity.toUpperCase()}: ${w.message}`)
            };
          })
        };
      });

      return new Response(
        JSON.stringify({
          message: 'Query preview generated with QA validation',
          dryRun: true,
          lifeline: {
            characterName,
            collectionTitle,
            actorName,
            type: lifelineType
          },
          queryPreview,
          qaReport
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
