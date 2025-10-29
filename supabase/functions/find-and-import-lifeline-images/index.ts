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

// ===== V4.1 IMAGE SEARCH LOGIC =====
// Collection-aware query builder - fixes universe-specific issues (no more GoT terms in Wicked)

const STOPWORDS = new Set([
  "born","the","a","an","we","when","everything","giving"
]);

const DENY = new Set(["romance","lover","intimate moment"]);

// ---------- DEFAULT (fallback) ANCHORS & THEMES ----------
const DEFAULT_ENTITY_ANCHORS = [
  "council","throne room","castle","tournament","arena","champion",
  "vision","prophecy","ritual","forest","ravens","dagger","sword"
];

const DEFAULT_THEME_MAP: Record<string, string[]> = {
  combat:   ["trial by combat","duel","arena","battle scene","weapon"],
  death:    ["death scene","falling","final moments"],
  magic:    ["visions","magic","transformation","ritual","prophecy"],
  politics: ["council","throne room","court","coronation"],
  allies:   ["companions","journey","group","reunion"],
  travel:   ["journey","traveling","exploration","landscape"],
  religion: ["ritual","vision","temple","prophecy"],
  betrayal: ["betrayal","revenge scene"]
};

const DEFAULT_BIASED_DOMAINS = ["imdb.com","fandom.com"];

// ---------- COLLECTION PROFILES ----------
type Profile = {
  match: (collectionTitle: string) => boolean;
  domains: string[];
  anchors: string[];
  themeMap?: Partial<Record<string, string[]>>;
  extraStop?: string[];
};

// Game of Thrones (Westeros)
const PROFILE_GOT: Profile = {
  match: t => /game\s*of\s*thrones|westeros|asoiaf/i.test(t),
  domains: ["hbo.com","imdb.com","fandom.com"],
  anchors: [
    "Winterfell","godswood","Dragonpit","Tower of Joy","Craster's Keep","weirwood","cave",
    "Hodor","Jojen Reed","Meera Reed","Three-Eyed Raven","Night King","Arya Stark","Jon Snow","Tyrion","Cersei","Jaime",
    "Valyrian steel dagger","ravens","dragons","The Wall","King's Landing"
  ],
  themeMap: {
    magic: ["visions","magic","weirwood","raven","warging","godswood"]
  }
};

// Wicked (Oz / Musical)
const PROFILE_WICKED: Profile = {
  match: t => /wicked|oz|emerald\s*city/i.test(t),
  domains: [
    "wickedthemusical.com","broadway.com","playbill.com","imdb.com","fandom.com","universalpictures.com"
  ],
  anchors: [
    "Emerald City","Shiz University","Ozdust Ballroom","Munchkinland","Yellow Brick Road","Glinda's Bubble",
    "Glinda","Elphaba","Fiyero","Nessarose","Madame Morrible","The Wizard of Oz",
    "wand","broom","spellbook","throne","bubble","stage","duet","song"
  ],
  themeMap: {
    magic:     ["spell","wand","broom","bubble","stage effect","transformation"],
    politics:  ["council","public address","leadership","throne","Emerald City"],
    allies:    ["companions","duet","friendship","reunion"],
    travel:    ["journey","Yellow Brick Road","arrival","Emerald City"],
  },
  extraStop: [":"]
};

const PROFILES: Profile[] = [PROFILE_GOT, PROFILE_WICKED];

function findProfile(collectionTitle: string): Profile | undefined {
  return PROFILES.find(p => p.match(collectionTitle));
}

const TRIGGERS: Record<string, RegExp> = {
  combat:   /\b(trial|combat|fight|duel|battle|skirmish|attack)\b/i,
  death:    /\b(fall|pushed?|killed|wound|poison|death|dies?)\b/i,
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
    .filter(t => !STOPWORDS.has(t.toLowerCase()))
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

function dedupeWords(s: string) {
  const uniq: string[] = [];
  for (const w of s.split(/\s+/)) {
    if (!uniq.includes(w)) uniq.push(w);
  }
  return uniq.join(" ");
}

function buildQueries(
  entry: Entry, 
  characterName?: string, 
  collectionTitle?: string,
  actorName?: string
): string[] {
  if (!characterName || !collectionTitle) {
    console.log('  WARNING: Missing characterName or collectionTitle, cannot build v4.1 queries');
    return [];
  }

  const profile = findProfile(collectionTitle);
  const extraStops = profile?.extraStop ?? [];

  // Subject string: strip odd punctuation (colon becomes space)
  const cleanCollection = collectionTitle.replace(/[:]/g, " ");
  const subject = [characterName, cleanCollection, actorName]
    .filter(Boolean)
    .join(" ");

  const baseText = `${entry.title} ${entry.summary || entry.details || ''}`;

  // Theme cues: use profile.themeMap overrides where present; otherwise default
  const effectiveThemeMap = {
    ...DEFAULT_THEME_MAP,
    ...(profile?.themeMap ?? {})
  } as Record<string, string[]>;
  const themes = findThemes(baseText);
  let cueWords = pickThemeCues(themes, effectiveThemeMap);

  // Anchors: profile anchors + default fallback
  const anchorUniverse = [
    ...(profile?.anchors ?? []),
    ...DEFAULT_ENTITY_ANCHORS
  ];
  let anchors = harvestEntityAnchors(baseText, anchorUniverse);
  anchors = enforceMinimumAnchors(anchors, baseText, 2);

  // Sanitize & deny-list
  const titleTokens = sanitizeTokens(tokenize(entry.title), extraStops);
  cueWords = removeDenied(cueWords);
  const cleanedTitle = titleTokens.filter(t => t.length > 2 && /^[a-zA-Z'-]+$/.test(t));

  console.log(`  Extracted ${anchors.length} anchors, ${cueWords.length} theme cues, ${cleanedTitle.length} title tokens`);

  const genericTail = "scene still screenshot";

  // Variant 1: Broad
  const broadRaw = `${subject} ${[...new Set([...cleanedTitle, ...cueWords, ...anchors])].join(" ")} ${genericTail}`;
  const broad = normalizeSpaces(dedupeWords(broadRaw));

  // Variant 2: Context-focused
  const strong2 = anchors.slice(0, 2).join(" ");
  const context = normalizeSpaces(`${subject} ${strong2} scene still`);

  // Variant 3: Domain-biased
  const domains = (profile?.domains ?? DEFAULT_BIASED_DOMAINS).join(" OR site:");
  const domainExpr = `site:${domains}`;
  const domainBiased = normalizeSpaces(`${subject} ${strong2} ${domainExpr}`);

  return [broad, context, domainBiased];
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
