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

function findProfile(collectionTitle: string): Profile | undefined {
  return PROFILES.find(p => p.match(collectionTitle));
}

// Possessive handling: "Fiyero's Arrival" -> "Fiyero Arrival"
function stripPossessives(s: string): string {
  return s.replace(/(\p{L}+)'s\b/gu, "$1").replace(/(\p{L}+)'s\b/gu, "$1");
}

const TRIGGERS: Record<string, RegExp> = {
  combat:   /\b(trial|combat|fight|duel|battle|skirmish|attack)\b/i,
  // PATCH 5: make death stricter (explicit words only)
  death:    /\b(die[sd]?|death|killed|slain|funeral|corpse|grave)\b/i,
  magic:    /\b(vision|spell|magic|enchanted|warg|greenseer|dream|power|raven|weirwood|godswood|broom|wand|bubble)\b/i,
  politics: /\b(king|queen|council|throne|ruler|elect|election|coronation|dragonpit|mayor|leadership|address)\b/i,
  allies:   /\b(meeting|friend|ally|companion|protect|reunion|group|companions?|duet)\b/i,
  travel:   /\b(journey|travel|beyond|arriv|explor|road)\b/i,
  religion: /\b(god|faith|ritual|temple|prophec|vision|church)\b/i,
  betrayal: /\b(betray|revenge|vengeance|frame|accuse)\b/i
};

function tokenize(text: string): string[] {
  return text
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function sanitizeTokens(tokens: string[], extraStop: string[] = []): string[] {
  const EX = new Set(extraStop.map(s => s.toLowerCase()));
  return tokens
    .map(t => t.trim())
    // lowercase check for scrubs
    .filter(t => !STOPWORDS.has(t.toLowerCase()))
    .filter(t => !PRONOUNS.has(t.toLowerCase()))
    .filter(t => !EX.has(t.toLowerCase()));
}

function findThemes(text: string): string[] {
  return Object.keys(TRIGGERS).filter(k => TRIGGERS[k].test(text));
}

function pickThemeCues(themes: string[], themeMap: Record<string, string[]>): string[] {
  const list: string[] = [];
  for (const th of themes) {
    for (const c of themeMap[th] || []) {
      if (!list.includes(c)) list.push(c);
    }
  }
  return list.slice(0, 6);
}

function harvestEntityAnchors(text: string, anchors: string[]): string[] {
  const found: string[] = [];
  for (const a of anchors) {
    const rx = new RegExp(`\\b${a.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`, "i");
    if (rx.test(text) && !found.includes(a)) found.push(a);
  }
  return found;
}

function enforceMinimumAnchors(anchors: string[], extraText: string, min = 2): string[] {
  if (anchors.length >= min) return anchors;
  // fallback: pull capitalized phrases
  const caps = (extraText.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b/g) || []);
  for (const c of caps) {
    if (!anchors.includes(c)) anchors.push(c);
    if (anchors.length >= min) break;
  }
  return anchors;
}

function removeDenied(texts: string[]): string[] {
  return texts.filter(t => !DENY.has(t.toLowerCase()));
}

function normalizeSpaces(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function dedupeWordsPreserveOrder(words: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    if (!seen.has(w)) { seen.add(w); out.push(w); }
  }
  return out;
}

// PATCH 6: soft musical cues for certain title keywords
const TITLE_SOFT_CUES: { rx: RegExp; cues: string[] }[] = [
  { rx: /\b(popular|born to shine|for good|defy|defying|dance|dancing|song|duet)\b/i, cues: ["stage","duet","song","spotlight"] },
  { rx: /\b(invitation|address|speech)\b/i, cues: ["public address","stage"] },
];

function maybeAddTitleSoftCues(title: string, cues: string[]): string[] {
  const out = cues.slice();
  for (const rule of TITLE_SOFT_CUES) {
    if (rule.rx.test(title)) {
      for (const c of rule.cues) if (!out.includes(c)) out.push(c);
    }
  }
  return out;
}

// pick 2 "strongest" anchors, prefer place/object + person
function pickStrongAnchors(anchors: string[], kinds?: Profile["anchorKinds"]): string[] {
  if (!anchors.length) return [];
  if (!kinds) return anchors.slice(0, 2);

  const place = anchors.find(a => kinds.place?.includes(a));
  const obj   = anchors.find(a => kinds.object?.includes(a));
  const person= anchors.find(a => kinds.person?.includes(a));
  const result: string[] = [];

  if (place && person) return [place, person];
  if (obj && person)   return [obj, person];

  // otherwise, just take first two available
  return anchors.slice(0, 2);
}

// ============================================================
// QA VALIDATION
// ============================================================

interface QAWarning {
  type: 'anchor_count' | 'pronoun_present' | 'duplicate_words' | 'denied_term' | 'missing_character';
  severity: 'error' | 'warning';
  message: string;
  query: string;
}

function validateQuery(
  query: string,
  characterName: string,
  collectionTitle: string,
  anchors: string[],
  cueWords: string[]
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
  
  // Check 2: Anchor count (should have at least 2 for context queries)
  const anchorCount = anchors.filter(a => queryLower.includes(a.toLowerCase())).length;
  if (anchorCount < 2 && query.includes('scene still')) {
    warnings.push({
      type: 'anchor_count',
      severity: 'warning',
      message: `Only ${anchorCount} anchors found in query (expected ≥2)`,
      query
    });
  }
  
  // Check 3: Pronouns present
  const foundPronouns = tokens.filter(t => PRONOUNS.has(t.toLowerCase()));
  if (foundPronouns.length > 0) {
    warnings.push({
      type: 'pronoun_present',
      severity: 'error',
      message: `Pronouns found: ${foundPronouns.join(', ')}`,
      query
    });
  }
  
  // Check 4: Duplicate words
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
  
  // Check 5: Denied terms
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

  // Extract basic info for QA validation
  const baseText = `${entry.title} ${entry.summary || entry.details || ''}`;
  
  // For QA purposes, extract proper nouns as anchors
  const properNouns = (baseText.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b/g) || []).slice(0, 5);
  const anchors = properNouns.length > 0 ? properNouns : [characterName];
  const cueWords: string[] = []; // v4.2 handles cues internally

  console.log(`  Extracted ${anchors.length} anchors for QA validation`);

  // Run QA validation and log warnings
  const allQueries = [
    { name: 'Broad', query: queries[0] },
    { name: 'Context', query: queries[1] },
    { name: 'Domain-biased', query: queries[2] }
  ];

  for (const { name, query } of allQueries) {
    const warnings = validateQuery(query, characterName, collectionTitle, anchors, cueWords);
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
        const entry = entries.find(e => e.title === preview.entryTitle)!;
        const baseText = `${entry.title} ${entry.summary || entry.details || ''}`;
        const themes = findThemes(baseText);
        const profile = findProfile(collectionTitle);
        const anchorUniverse = [...(profile?.anchors ?? []), ...DEFAULT_ENTITY_ANCHORS];
        const anchors = harvestEntityAnchors(baseText, anchorUniverse);
        const effectiveThemeMap = { ...DEFAULT_THEME_MAP, ...(profile?.themeMap ?? {}) } as Record<string, string[]>;
        const cueWords = pickThemeCues(themes, effectiveThemeMap);
        
        return {
          entryTitle: preview.entryTitle,
          queries: preview.queries.map((q, idx) => {
            const type = ['Broad', 'Context', 'Domain-biased'][idx];
            const warnings = validateQuery(q, characterName, collectionTitle, anchors, cueWords);
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
